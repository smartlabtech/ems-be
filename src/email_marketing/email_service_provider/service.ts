// File: src/email_marketing/email_service_provider/service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { EmailServiceProvider, EmailServiceProviderDocument } from './schema';
import { ME_email, MEEmailDocument } from '../ME_email/schema';
import { EmailSource, EmailStatus } from '../ME_email/enum';
import { MEMessageService } from '../ME_message/service';
import { CreateEmailServiceProviderDto } from './dto.create';
import { UpdateEmailServiceProviderDto } from './dto.update';
import { QueryEmailServiceProviderDto } from './dto.query';
import { IEmailServiceProvider, IEmailTestResult, IEmailServiceProviderResponse } from './interface';
import { EmailServiceProviderType, EmailServiceProviderStatus, SortTypeEnum } from './enum';
import { UserDocument } from '../../schema';
import { EmailProviderFactory } from './providers/provider-factory.service';
import { IEmailProviderConfig } from './providers/base/base-provider.interface';
import { SendBulkEmailDto, EmailSendResult, BulkEmailResponse, EmailContentType } from './dto.send-email';
import { IEmailSendOptions } from './providers/base/base-provider.interface';
import { MessageContentType } from '../ME_message/schema';

@Injectable()
export class EmailServiceProviderService {
  constructor(
    @InjectModel(EmailServiceProvider.name)
    private readonly emailServiceProviderModel: Model<EmailServiceProviderDocument>,
    @InjectModel(ME_email.name)
    private readonly meEmailModel: Model<MEEmailDocument>,
    private readonly meMessageService: MEMessageService,
    private readonly providerFactory: EmailProviderFactory,
  ) { }

  async create(data: CreateEmailServiceProviderDto, user: UserDocument): Promise<IEmailServiceProvider> {
    try {
      // Set the creator from the authenticated user
      const createData = {
        ...data,
        creator: user._id
      };

      // Check if email service provider already exists for this name for this user
      const nameExists = await this.emailServiceProviderModel.findOne({
        name: createData.name,
        creator: user._id
      });

      if (nameExists) {
        throw new ConflictException(`Email service provider with name ${createData.name} already exists`);
      }

      // Check if email service provider already exists for this baseUrl for this user
      const baseUrlExists = await this.emailServiceProviderModel.findOne({
        baseUrl: createData.baseUrl,
        creator: user._id
      });

      if (baseUrlExists) {
        throw new ConflictException(`Email service provider with baseUrl ${createData.baseUrl} already exists`);
      }

      // Validate configuration and test email before saving
      const testResult = await this.testEmailConfiguration(createData.type, createData);
      if (!testResult.success) {
        throw new BadRequestException(`Email configuration test failed: ${testResult.error}`);
      }

      // Fetch email accounts for ERPNext providers before creating
      if (createData.type === EmailServiceProviderType.ERPNEXT) {
        try {
          // Create a temporary provider object for fetching
          const tempProvider = {
            type: createData.type,
            baseUrl: createData.baseUrl,
            token: createData.token,
          } as EmailServiceProviderDocument;

          const emailAccounts = await this.fetchEmailAccounts(tempProvider);
          createData.emailAccounts = emailAccounts;
        } catch (error) {
          console.error('Failed to fetch email accounts before creation:', error.message);
          throw new BadRequestException(`Failed to fetch email accounts from ERPNext: ${error.message}`);
        }
      }

      // If setting as default, unset other defaults for this creator
      if (createData.default) {
        await this.emailServiceProviderModel.updateMany(
          { creator: user._id },
          { $set: { default: false } }
        );
      }

      const newProvider = await this.emailServiceProviderModel.create(createData);
      return this.toInterface(newProvider);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email service provider for this sender and type already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryEmailServiceProviderDto, user: UserDocument): Promise<IEmailServiceProviderResponse> {
    const filter = await this.buildFilter(query, user);

    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const skip = (page - 1) * size;

    // Build sort object
    const sort: any = {};
    if (query.orderBy && query.sortType) {
      sort[query.orderBy] = query.sortType === SortTypeEnum.ASCENDING ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default sort by creation date descending
    }

    const [providers, total] = await Promise.all([
      this.emailServiceProviderModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(size)
        .populate('creator', 'name email')
        .exec(),
      this.emailServiceProviderModel.countDocuments(filter)
    ]);

    // Check if we should skip third-party updates (for performance)
    const skipThirdPartyUpdates = query.skipThirdPartyUpdates === true;

    // If not skipping, fetch fresh email accounts for ERPNext providers
    const providersWithErrors = await Promise.all(
      providers.map(async (provider) => {
        let thirdPartyError = null;
        
        if (provider.type === EmailServiceProviderType.ERPNEXT && !skipThirdPartyUpdates) {
          try {
            // Add a timeout wrapper for the fetch operation
            const fetchPromise = this.fetchEmailAccounts(provider);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Third-party API timeout (5s)')), 5000)
            );
            
            const emailAccounts = await Promise.race([
              fetchPromise,
              timeoutPromise
            ]) as any;

            // Update the provider with fresh email accounts asynchronously
            // Don't wait for this to complete
            this.emailServiceProviderModel.findByIdAndUpdate(
              provider._id,
              { $set: { emailAccounts, updatedAt: new Date() } }
            ).exec().catch(err => 
              console.error(`Failed to update provider ${provider._id}:`, err.message)
            );

            // Update the provider object for response
            provider.emailAccounts = emailAccounts;
            provider.updatedAt = new Date();
          } catch (error) {
            console.error(`Failed to fetch email accounts for provider ${provider._id}:`, error.message);
            // Capture the error to include in the response
            thirdPartyError = {
              message: error.message || 'Failed to fetch email accounts from ERPNext',
              timestamp: new Date(),
              details: error.response?.data || error.details || null
            };
          }
        }
        
        // Return both provider and error separately
        return { provider, thirdPartyError };
      })
    );

    return {
      data: providersWithErrors.map(({ provider, thirdPartyError }) => 
        this.toInterface(provider, thirdPartyError)
      ),
      total,
      page,
      size,
    };
  }

  async findById(id: string, user: UserDocument): Promise<IEmailServiceProvider> {
    const provider = await this.emailServiceProviderModel
      .findOne({ _id: id, creator: user._id })
      .populate('creator', 'name email')
      .exec();

    if (!provider) {
      throw new NotFoundException(`Email service provider with ID ${id} not found or you don't have access to it`);
    }

    let thirdPartyError = null;

    // Fetch fresh email accounts for ERPNext providers
    if (provider.type === EmailServiceProviderType.ERPNEXT) {
      try {
        const emailAccounts = await this.fetchEmailAccounts(provider);

        // Update the provider with fresh email accounts
        await this.emailServiceProviderModel.findByIdAndUpdate(
          id,
          { $set: { emailAccounts, updatedAt: new Date() } }
        );

        // Update the provider object for response
        provider.emailAccounts = emailAccounts;
        provider.updatedAt = new Date();
      } catch (error) {
        console.error('Failed to fetch email accounts in findById:', error.message);
        // Capture the error to include in the response
        thirdPartyError = {
          message: error.message || 'Failed to fetch email accounts from ERPNext',
          timestamp: new Date(),
          details: error.response?.data || error.details || null
        };
      }
    }

    return this.toInterface(provider, thirdPartyError);
  }

  async findByCreator(creatorId: string): Promise<IEmailServiceProvider[]> {
    const providers = await this.emailServiceProviderModel
      .find({ creator: creatorId })
      .populate('creator', 'name email')
      .exec();

    return providers.map(provider => this.toInterface(provider));
  }

  async findDefault(creatorId: string): Promise<IEmailServiceProvider | null> {
    const provider = await this.emailServiceProviderModel
      .findOne({ creator: creatorId, default: true, status: EmailServiceProviderStatus.ACTIVE })
      .populate('creator', 'name email')
      .exec();

    if (!provider) {
      return null;
    }

    let thirdPartyError = null;

    // Fetch fresh email accounts for ERPNext providers
    if (provider.type === EmailServiceProviderType.ERPNEXT) {
      try {
        const emailAccounts = await this.fetchEmailAccounts(provider);

        // Update the provider with fresh email accounts
        await this.emailServiceProviderModel.findByIdAndUpdate(
          provider._id,
          { $set: { emailAccounts, updatedAt: new Date() } }
        );

        // Update the provider object for response
        provider.emailAccounts = emailAccounts;
        provider.updatedAt = new Date();
      } catch (error) {
        console.error('Failed to fetch email accounts in findDefault:', error.message);
        // Capture the error to include in the response
        thirdPartyError = {
          message: error.message || 'Failed to fetch email accounts from ERPNext',
          timestamp: new Date(),
          details: error.response?.data || error.details || null
        };
      }
    }

    return this.toInterface(provider, thirdPartyError);
  }

  async update(id: string, data: UpdateEmailServiceProviderDto, user: UserDocument): Promise<IEmailServiceProvider> {
    const provider = await this.emailServiceProviderModel.findOne({ _id: id, creator: user._id });
    if (!provider) {
      throw new NotFoundException(`Email service provider with ID ${id} not found or you don't have access to it`);
    }

    // Prepare the update data
    const updateData = { ...data };

    // If baseUrl or token is being updated, test the new configuration
    if (data.baseUrl || data.token) {
      const mergedProvider = {
        ...provider.toObject(),
        ...updateData
      };
      const testResult = await this.testEmailConfiguration(
        data.type || provider.type,
        mergedProvider
      );
      if (!testResult.success) {
        throw new BadRequestException(`Email configuration test failed: ${testResult.error}`);
      }

      // Fetch email accounts for ERPNext providers before updating
      if ((data.type || provider.type) === EmailServiceProviderType.ERPNEXT) {
        try {
          // Create a temporary provider object for fetching with new values
          const tempProvider = {
            type: data.type || provider.type,
            baseUrl: data.baseUrl || provider.baseUrl,
            token: data.token || provider.token,
          } as EmailServiceProviderDocument;

          const emailAccounts = await this.fetchEmailAccounts(tempProvider);
          updateData.emailAccounts = emailAccounts;
        } catch (error) {
          console.error('Failed to fetch email accounts before update:', error.message);
          throw new BadRequestException(`Failed to fetch email accounts from ERPNext: ${error.message}`);
        }
      }
    }

    // Check for name uniqueness if name is being updated
    if (data.name && data.name !== provider.name) {
      const existingProvider = await this.emailServiceProviderModel.findOne({
        name: data.name,
        creator: user._id,
        _id: { $ne: id } // Exclude the current provider being updated
      });

      if (existingProvider) {
        throw new ConflictException(`Email service provider with name ${data.name} already exists`);
      }
    }

    // Check for baseUrl uniqueness if baseUrl is being updated
    if (data.baseUrl && data.baseUrl !== provider.baseUrl) {
      const existingProvider = await this.emailServiceProviderModel.findOne({
        baseUrl: data.baseUrl,
        creator: user._id,
        _id: { $ne: id } // Exclude the current provider being updated
      });

      if (existingProvider) {
        throw new ConflictException(`Email service provider with baseUrl ${data.baseUrl} already exists`);
      }
    }

    // If setting as default, unset other defaults for this creator
    if (data.default === true) {
      await this.emailServiceProviderModel.updateMany(
        { creator: user._id, _id: { $ne: id } },
        { $set: { default: false } }
      );
    }

    const updatedProvider = await this.emailServiceProviderModel.findByIdAndUpdate(
      id,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    ).populate('creator', 'name email');

    return this.toInterface(updatedProvider);
  }

  async delete(id: string, user: UserDocument): Promise<{ success: boolean; message: string }> {
    try {
      const provider = await this.emailServiceProviderModel.findOne({ _id: id, creator: user._id });
      if (!provider) {
        throw new NotFoundException(`Email service provider with ID ${id} not found or you don't have access to it`);
      }

      await this.emailServiceProviderModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Email service provider deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting email service provider:', error);
      throw new InternalServerErrorException('Failed to delete email service provider');
    }
  }

  async deleteAdmin(id: string, user: UserDocument): Promise<{ success: boolean; message: string }> {
    try {
      const provider = await this.emailServiceProviderModel.findById(id);
      if (!provider) {
        throw new NotFoundException(`Email service provider with ID ${id} not found`);
      }

      await this.emailServiceProviderModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Email service provider deleted successfully by admin'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting email service provider (admin):', error);
      throw new InternalServerErrorException('Failed to delete email service provider');
    }
  }

  async testConfiguration(id: string, user: UserDocument): Promise<IEmailTestResult> {
    const provider = await this.emailServiceProviderModel.findOne({ _id: id, creator: user._id });
    if (!provider) {
      throw new NotFoundException(`Email service provider with ID ${id} not found or you don't have access to it`);
    }

    return await this.testEmailConfiguration(provider.type, provider.toObject());
  }

  private async fetchEmailAccounts(provider: EmailServiceProviderDocument): Promise<any> {
    if (provider.type !== EmailServiceProviderType.ERPNEXT) {
      throw new BadRequestException('Email account fetching is only supported for ERPNext providers');
    }

    try {
      const providerService = this.providerFactory.getProvider(provider.type);

      // Prepare config for the provider service
      const config: IEmailProviderConfig = {
        name: provider.name,
        baseUrl: provider.baseUrl,
        token: provider.token,
      };

      // Use the provider's fetchEmailAccounts method if available
      if (providerService.fetchEmailAccounts) {
        return await providerService.fetchEmailAccounts(config);
      }

      throw new BadRequestException('Email account fetching is not implemented for this provider');
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch email accounts');
    }
  }

  private async testEmailConfiguration(type: EmailServiceProviderType, provider: any): Promise<IEmailTestResult> {
    try {
      console.log(`Testing email configuration for type: ${type}`);

      const providerService = this.providerFactory.getProvider(type);

      // Prepare config for the provider service
      const config: IEmailProviderConfig = {
        name: provider.name,
        baseUrl: provider.baseUrl,
        token: provider.token,
        // For providers created via DTO, these fields might be present
        apiKey: provider.apiKey,
        apiSecret: provider.apiSecret,
        domain: provider.domain,
        host: provider.host,
        port: provider.port,
        secure: provider.secure,
        auth: provider.auth,
      };

      const result = await providerService.testConfiguration(config);

      // Ensure message is always present
      return {
        success: result.success,
        message: result.message || (result.success ? 'Configuration test successful' : 'Configuration test failed'),
        error: result.error
      };
    } catch (error) {
      console.error('Email configuration test error:', error);
      if (error instanceof BadRequestException) {
        // Provider not implemented
        return {
          success: false,
          message: error.message,
          error: error.message
        };
      }
      return {
        success: false,
        message: 'Configuration test failed',
        error: error.message || 'Unknown error'
      };
    }
  }

  private async buildFilter(query: QueryEmailServiceProviderDto, user: UserDocument): Promise<any> {
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { type: { $regex: query.search, $options: 'i' } },
        { baseUrl: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.status) filter.status = query.status;
    if (query.creator) filter.creator = new Types.ObjectId(query.creator);
    if (query.default !== undefined) filter.default = query.default;
    if (query.type) filter.type = query.type;

    // Date range filters
    if (query.createdFrom || query.createdTo) {
      filter.createdAt = {};
      if (query.createdFrom) filter.createdAt.$gte = new Date(query.createdFrom);
      if (query.createdTo) filter.createdAt.$lte = new Date(query.createdTo);
    }

    if (query.updatedFrom || query.updatedTo) {
      filter.updatedAt = {};
      if (query.updatedFrom) filter.updatedAt.$gte = new Date(query.updatedFrom);
      if (query.updatedTo) filter.updatedAt.$lte = new Date(query.updatedTo);
    }

    filter.creator = new Types.ObjectId(user._id);

    return filter;
  }

  private toInterface(doc: EmailServiceProviderDocument, thirdPartyError?: any): IEmailServiceProvider {
    if (!doc) return null;

    // Handle creator field - it might be populated or just an ObjectId
    let creatorId: string;
    if (doc.creator && typeof doc.creator === 'object' && '_id' in doc.creator) {
      // Creator is populated
      creatorId = doc.creator._id.toString();
    } else if (doc.creator) {
      // Creator is just an ObjectId
      creatorId = doc.creator.toString();
    } else {
      // Fallback - should not happen in normal circumstances
      creatorId = '';
    }

    return {
      _id: doc._id.toString(),
      name: doc.name,
      status: doc.status,
      creator: creatorId,
      default: doc.default,
      type: doc.type,
      baseUrl: doc.baseUrl,
      token: doc.token,
      emailAccounts: doc.emailAccounts || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      thirdPartyError: thirdPartyError || undefined,
    };
  }

  /**
   * Replace template variables in text with actual values
   * Supports {{variableName}} syntax
   */
  private processTemplate(template: string, variables: Record<string, string>, emailRecord: MEEmailDocument): string {
    let processed = template;

    // Default variables from email record
    const defaultVars = {
      firstName: emailRecord.firstName || '',
      lastName: emailRecord.lastName || '',
      email: emailRecord.email || '',
      mobile: emailRecord.mobile || '',
      whatsapp: emailRecord.whatsapp || '',
    };

    // Merge with provided variables (custom variables override defaults)
    const allVars = { ...defaultVars, ...variables };

    // Replace all template variables
    Object.entries(allVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      processed = processed.replace(regex, value || '');
    });

    // Clean up any remaining unreplaced variables
    processed = processed.replace(/{{[^}]*}}/g, '');

    return processed;
  }

  /**
   * Add tracking parameters to all links in HTML content
   * Appends userId parameter to each href to track link clicks per recipient
   */
  private addTrackingToLinks(html: string, userId: string): string {
    if (!html || !userId) {
      return html;
    }

    // Regex to match href attributes in anchor tags
    // Captures: href="url" or href='url'
    const hrefRegex = /(<a\s+[^>]*href\s*=\s*)(["'])([^"']+)\2/gi;

    return html.replace(hrefRegex, (match, prefix, quote, url) => {
      // Skip mailto:, tel:, javascript:, and fragment-only links
      const lowerUrl = url.toLowerCase().trim();
      if (
        lowerUrl.startsWith('mailto:') ||
        lowerUrl.startsWith('tel:') ||
        lowerUrl.startsWith('javascript:') ||
        lowerUrl.startsWith('#') ||
        lowerUrl === ''
      ) {
        return match;
      }

      try {
        // Handle relative URLs and absolute URLs
        let modifiedUrl: string;

        // Check if URL already has query parameters
        if (url.includes('?')) {
          // Append UID to existing query string
          modifiedUrl = `${url}&UID=${encodeURIComponent(userId)}`;
        } else if (url.includes('#')) {
          // URL has fragment but no query - insert query before fragment
          const [baseUrl, fragment] = url.split('#');
          modifiedUrl = `${baseUrl}?UID=${encodeURIComponent(userId)}#${fragment}`;
        } else {
          // No query string or fragment - add query parameter
          modifiedUrl = `${url}?UID=${encodeURIComponent(userId)}`;
        }

        return `${prefix}${quote}${modifiedUrl}${quote}`;
      } catch (error) {
        // If URL parsing fails, return original match
        console.warn(`Failed to add tracking to URL: ${url}`, error);
        return match;
      }
    });
  }

  async sendBulkEmails(data: SendBulkEmailDto, user: UserDocument): Promise<BulkEmailResponse> {
    const startTime = Date.now();
    console.log(`[BATCH DEBUG] Starting bulk email send at ${new Date().toISOString()}`);
    console.log(`[BATCH DEBUG] Configuration: batchProcess=${data.batchProcess}, batchSize=${data.batchSize}`);

    // Verify the provider exists and belongs to the user
    const provider = await this.emailServiceProviderModel
      .findOne({ _id: data.providerId, creator: user._id })
      .exec();

    if (!provider) {
      throw new NotFoundException(`Email service provider with ID ${data.providerId} not found or you don't have access to it`);
    }

    // Check if provider is active
    if (provider.status !== EmailServiceProviderStatus.ACTIVE) {
      throw new BadRequestException(`Email service provider is not active`);
    }

    // Verify sender email is configured in the provider
    const senderExists = provider.emailAccounts.some(
      account => account.sender.toLowerCase() === data.senderEmail.toLowerCase()
    );

    if (!senderExists && provider.type === EmailServiceProviderType.ERPNEXT) {
      throw new BadRequestException(`Sender email ${data.senderEmail} is not configured in this provider`);
    }

    // Separate recipients by mode
    const dbRecipients = data.recipients.filter(r => r.recipientId);
    const directRecipients = data.recipients.filter(r => r.recipient);

    console.log(`[BATCH DEBUG] Total recipients: ${data.recipients.length} (${dbRecipients.length} database, ${directRecipients.length} direct)`);

    // Process database recipients (with tracking)
    let dbEmailRecords: any[] = [];
    const recipientBodyMap = new Map();
    const recipientSubjectMap = new Map();

    if (dbRecipients.length > 0) {
      // Extract recipient IDs from the database recipients
      const recipientIds = dbRecipients.map(r => r.recipientId);

      // Fetch email records from ME_email collection
      dbEmailRecords = await this.meEmailModel.find({
        _id: { $in: recipientIds.map(id => new Types.ObjectId(id)) },
        creator: user._id // Ensure emails belong to the user
      }).exec();

      if (dbEmailRecords.length === 0 && directRecipients.length === 0) {
        throw new BadRequestException('No valid email records found for the provided IDs');
      }

      // Log if some IDs were not found
      if (dbEmailRecords.length !== dbRecipients.length) {
        console.warn(`Found ${dbEmailRecords.length} emails out of ${dbRecipients.length} requested IDs`);
      }

      // Create maps for database recipients
      dbRecipients.forEach(r => {
        recipientBodyMap.set(r.recipientId, { body: r.body, templateVars: r.templateVars || {} });
        if (r.subject) {
          recipientSubjectMap.set(r.recipientId, r.subject);
        }
      });
    }

    // Process direct recipients - create or find them in database
    const directEmailRecords = [];
    for (const r of directRecipients) {
      // Check if email already exists
      let emailRecord = await this.meEmailModel.findOne({
        email: r.recipient,
        creator: user._id
      }).exec();

      // If not exists, create it
      if (!emailRecord) {
        emailRecord = await this.meEmailModel.create({
          email: r.recipient,
          firstName: r.templateVars?.firstName || '',
          lastName: r.templateVars?.lastName || '',
          mobile: r.templateVars?.mobile || '',
          whatsapp: r.templateVars?.whatsapp || '',
          source: EmailSource.IN,
          creator: user._id,
          status: EmailStatus.ACTIVE
        });
        console.log(`Created new email record for direct recipient: ${r.recipient}`);
      }

      directEmailRecords.push(emailRecord);

      // Create maps for direct recipients using the real _id
      recipientBodyMap.set(emailRecord._id.toString(), { body: r.body, templateVars: r.templateVars || {} });
      if (r.subject) {
        recipientSubjectMap.set(emailRecord._id.toString(), r.subject);
      }
    }

    // Combine all email records for processing
    const allEmailRecords = [...dbEmailRecords, ...directEmailRecords];

    if (allEmailRecords.length === 0) {
      throw new BadRequestException('No recipients to process');
    }

    // Get the provider service
    const providerService = this.providerFactory.getProvider(provider.type);

    // Prepare provider configuration
    const providerConfig: IEmailProviderConfig = {
      name: provider.name,
      baseUrl: provider.baseUrl,
      token: provider.token,
      emailAccounts: provider.emailAccounts,
      // Add other fields that might be in the provider document
      apiKey: (provider as any).apiKey,
      domain: (provider as any).domain,
      host: (provider as any).host,
      port: (provider as any).port,
      secure: (provider as any).secure,
      auth: (provider as any).auth,
    };

    // Process recipients
    const results: EmailSendResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Determine if we should process in batches
    const shouldBatch = data.batchProcess && allEmailRecords.length > data.batchSize;
    const batchSize = data.batchSize || 100;
    const totalBatches = shouldBatch ? Math.ceil(allEmailRecords.length / batchSize) : 1;

    console.log(`Starting bulk email send: ${allEmailRecords.length} recipients, ${totalBatches} batches`);

    // Process emails in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, allEmailRecords.length);
      const batchRecords = allEmailRecords.slice(start, end);

      const batchStartTime = Date.now();
      console.log(`[BATCH DEBUG] Starting batch ${batchIndex + 1}/${totalBatches}: ${batchRecords.length} recipients at ${new Date().toISOString()}`);

      // Send emails in parallel within the batch
      const batchPromises = batchRecords.map(async (emailRecord, emailIndex) => {
        const emailStartTime = Date.now();
        const requestId = `batch${batchIndex + 1}_email${emailIndex + 1}_${emailRecord._id.toString().slice(-6)}`;

        console.log(`[PARALLEL DEBUG] [${requestId}] Starting email send to ${emailRecord.email} at ${new Date().toISOString()}`);

        try {
          // Get the personalized body and template vars for this recipient
          const recipientData = recipientBodyMap.get(emailRecord._id.toString());

          if (!recipientData) {
            console.warn(`[${requestId}] No personalized body found for recipient ${emailRecord.email}`);
            failureCount++;
            return {
              email: emailRecord.email,
              success: false,
              error: 'No personalized body provided for this recipient',
              recordId: emailRecord._id.toString(),
              mode: 'database'
            } as EmailSendResult;
          }

          // Process templates for body
          let processedBody = this.processTemplate(recipientData.body, recipientData.templateVars, emailRecord);

          // Add userId tracking parameter to all links in HTML content
          if (data.contentType === EmailContentType.HTML) {
            processedBody = this.addTrackingToLinks(processedBody, emailRecord._id.toString());
          }

          // Process templates for subject
          const rawSubject = recipientSubjectMap.get(emailRecord._id.toString()) || data.subject;
          let processedSubject = this.processTemplate(rawSubject, recipientData.templateVars, emailRecord);

          // Add "Re:" prefix for reply emails if not already present
          if (data.in_reply_to && !processedSubject.match(/^Re:\s*/i)) {
            processedSubject = `Re: ${processedSubject}`;
          }

          // Prepare references array - include in_reply_to if it exists and not already in references
          let references = data.references || [];
          if (data.in_reply_to && !references.includes(data.in_reply_to)) {
            references = [...references, data.in_reply_to];
          }

          // Pre-generate the message ID for tracking purposes
          let preGeneratedMessageId: string;
          const currentTime = Date.now();
          preGeneratedMessageId = `${emailRecord._id.toString()}-${currentTime}-${data.senderEmail}`;
          
          // Pre-create message document to get the ID for tracking pixel
          let messageDocId: string | null = null;
          if (!data.in_reply_to && data.contentType === EmailContentType.HTML) {
            try {
              // Create a preliminary message entry to get the document ID
              const preliminaryMessage = await this.meMessageService.create({
                sender: data.senderEmail,
                message_id: preGeneratedMessageId,
                to: emailRecord.email,
                cc: (data.cc && data.cc.length > 0) ? data.cc.join(',') : "",
                bcc: (data.bcc && data.bcc.length > 0) ? data.bcc.join(',') : "",
                subject: processedSubject,
                message: processedBody, // Will be updated with tracking pixel
                contentType: MessageContentType.HTML,
                sent_or_received: 'sent',
                delivery_status: 'pending', // Mark as pending initially
                providerId: provider._id.toString(),
                in_reply_to: undefined,
                references: data.references || [],
                headers: data.headers,
                metadata: {
                  providerMessageId: null, // Will be updated after sending
                  generatedMessageId: preGeneratedMessageId,
                },
                timestamp: new Date().toISOString(),
              }, user);
              
              messageDocId = preliminaryMessage._id.toString();
              
              // Add tracking pixel with the actual message document ID
              const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
              const trackingPixelHtml = `<img src="https://mailtopmanager.com/api/tracking/open?emailId=${messageDocId}" width="1" height="1" style="display:block;border:0;outline:none;" alt="" />`;
              
              // Add tracking pixel to the end of the HTML body
              if (processedBody.includes('</body>')) {
                processedBody = processedBody.replace('</body>', `${trackingPixelHtml}</body>`);
              } else {
                // If no </body> tag, append to the end
                processedBody = `${processedBody}${trackingPixelHtml}`;
              }
              
              // Update the message with the body containing tracking pixel
              await this.meMessageService.update(messageDocId, { message: processedBody }, user);
            } catch (preCreateError) {
              console.error(`Failed to pre-create message for tracking: ${preCreateError}`);
              // Continue without tracking pixel
            }
          }

          // Prepare email options
          const emailOptions: IEmailSendOptions = {
            from: data.senderEmail,
            to: emailRecord.email,
            subject: processedSubject,
            ...(data.contentType === EmailContentType.HTML ? { html: processedBody } : { text: processedBody }),
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            headers: data.headers,
            attachments: data.attachments?.map(att => ({
              filename: att.filename,
              content: att.content, // Assume base64 encoded
              contentType: att.contentType
            })),
            in_reply_to: data.in_reply_to,
            references: references
          };

          console.log(`[PARALLEL DEBUG] [${requestId}] Calling provider API for ${emailRecord.email} at ${new Date().toISOString()}`);

          // Send email
          const result = await providerService.sendEmail(providerConfig, emailOptions);

          const emailEndTime = Date.now();
          const emailDuration = emailEndTime - emailStartTime;

          if (result.success) {
            successCount++;
            console.log(`[PARALLEL DEBUG] [${requestId}] ✅ SUCCESS for ${emailRecord.email} in ${emailDuration}ms at ${new Date().toISOString()}`);

            // Save the message to ME_message collection for all recipients
            let messageId: string;
            let messageData: any = null;

            // For ERPNext, use the message_id from the response
            if (provider.type === EmailServiceProviderType.ERPNEXT && result.details) {
              if (result.details.erpnextMessageId) {
                messageId = result.details.erpnextMessageId;
                messageData = result.details.fullData;
              } else {
                // Fallback to generated ID if ERPNext didn't return one
                const currentTime = Date.now();
                messageId = `${emailRecord._id.toString()}-${currentTime}-${data.senderEmail}`;
              }
            } else {
              // For other providers, generate message_id
              const currentTime = Date.now();
              messageId = `${emailRecord._id.toString()}-${currentTime}-${data.senderEmail}`;
            }

            try {
              const metadataObject = {
                providerMessageId: result.messageId,
                generatedMessageId: messageId,
                messageData: messageData, // Save full ERPNext communication data
                debugInfo: {
                  requestId,
                  processingTime: emailDuration,
                  batchIndex: batchIndex + 1,
                  emailIndex: emailIndex + 1
                }
              };

              console.log('Constructed metadata object:', typeof metadataObject, metadataObject);

              // Debug logging for reply fields
              console.log(`[${requestId}] Creating message with in_reply_to:`, data.in_reply_to);
              console.log(`[${requestId}] Creating message with references:`, data.references);

              // Check if we already pre-created the message for tracking
              if (messageDocId && !data.in_reply_to && data.contentType === EmailContentType.HTML) {
                // Update the existing message with success status and metadata
                await this.meMessageService.update(messageDocId, {
                  delivery_status: 'sent',
                  metadata: metadataObject,
                }, user);
                console.log(`[${requestId}] Message updated successfully for ${emailRecord.email}`);
              } else {
                // Create new message (for replies or non-HTML emails)
                await this.meMessageService.create({
                  sender: data.senderEmail,
                  message_id: messageId,
                  to: emailRecord.email,
                  cc: (data.cc && data.cc.length > 0) ? data.cc.join(',') : "",
                  bcc: (data.bcc && data.bcc.length > 0) ? data.bcc.join(',') : "",
                  subject: processedSubject,
                  message: processedBody,
                  contentType: data.contentType === EmailContentType.HTML ? MessageContentType.HTML : MessageContentType.TEXT,
                  sent_or_received: 'sent',
                  delivery_status: 'sent',
                  providerId: provider._id.toString(),
                  in_reply_to: data.in_reply_to || undefined, // Use undefined for empty values
                  references: data.references || [],
                  headers: data.headers,
                  metadata: metadataObject,
                  timestamp: new Date().toISOString(), // Add createdAt timestamp
                }, user);
                console.log(`[${requestId}] Message saved successfully for ${emailRecord.email}`);
              }
            } catch (messageError) {
              console.error(`[${requestId}] Failed to save message for ${emailRecord.email}:`, messageError);
              // Don't fail the email send if message saving fails
            }

            return {
              email: emailRecord.email,
              success: true,
              messageId: result.messageId,
              recordId: emailRecord._id.toString(),
              mode: 'database' // All recipients are now database mode
            } as EmailSendResult;
          } else {
            failureCount++;
            console.log(`[PARALLEL DEBUG] [${requestId}] ❌ FAILED for ${emailRecord.email} in ${emailDuration}ms: ${result.error} at ${new Date().toISOString()}`);

            // Save failed message to ME_message collection for all recipients
            let messageId: string;
            let messageData: any = null;

            // For ERPNext failures, still try to use any returned data
            if (provider.type === EmailServiceProviderType.ERPNEXT && result.details) {
              if (result.details.erpnextMessageId) {
                messageId = result.details.erpnextMessageId;
                messageData = result.details.fullData || result.details;
              } else {
                // Fallback to generated ID
                const currentTime = Date.now();
                messageId = `${emailRecord._id.toString()}-${currentTime}-${data.senderEmail}`;
              }
            } else {
              // For other providers, generate message_id
              const currentTime = Date.now();
              messageId = `${emailRecord._id.toString()}-${currentTime}-${data.senderEmail}`;
            }

            try {
              const metadataObject = {
                error: result.error || 'Unknown error',
                generatedMessageId: messageId,
                messageData: messageData, // Save any available data
                debugInfo: {
                  requestId,
                  processingTime: emailDuration,
                  batchIndex: batchIndex + 1,
                  emailIndex: emailIndex + 1
                }
              };

              console.log('Constructed metadata object:', typeof metadataObject, metadataObject);

              await this.meMessageService.create({
                sender: data.senderEmail,
                message_id: messageId,
                to: emailRecord.email,
                cc: (data.cc && data.cc.length > 0) ? data.cc.join(',') : "",
                bcc: (data.bcc && data.bcc.length > 0) ? data.bcc.join(',') : "",
                subject: processedSubject,
                message: processedBody,
                contentType: data.contentType === EmailContentType.HTML ? MessageContentType.HTML : MessageContentType.TEXT,
                sent_or_received: 'sent',
                delivery_status: 'failed',
                providerId: provider._id.toString(),
                in_reply_to: data.in_reply_to || undefined,
                references: data.references || [],
                headers: data.headers,
                metadata: metadataObject,
                timestamp: new Date().toISOString(), // Add createdAt timestamp
              }, user);

              console.log(`[${requestId}] Failed message saved successfully for ${emailRecord.email}`);
            } catch (messageError) {
              console.error(`[${requestId}] Failed to save failed message for ${emailRecord.email}:`, messageError);
            }

            return {
              email: emailRecord.email,
              success: false,
              error: result.error || 'Unknown error',
              recordId: emailRecord._id.toString(),
              mode: 'database' // All recipients are now database mode
            } as EmailSendResult;
          }
        } catch (error) {
          const emailEndTime = Date.now();
          const emailDuration = emailEndTime - emailStartTime;
          console.error(`[PARALLEL DEBUG] [${requestId}] 💥 EXCEPTION for ${emailRecord.email} in ${emailDuration}ms:`, error.message);
          failureCount++;
          return {
            email: emailRecord.email,
            success: false,
            error: error.message || 'Failed to send email',
            recordId: emailRecord._id.toString(),
            mode: 'database' // All recipients are now database mode
          } as EmailSendResult;
        }
      });

      console.log(`[BATCH DEBUG] Batch ${batchIndex + 1} promises created, waiting for Promise.all() to complete...`);
      const batchPromiseStartTime = Date.now();

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);

      const batchEndTime = Date.now();
      const batchDuration = batchEndTime - batchStartTime;
      const promiseDuration = batchEndTime - batchPromiseStartTime;

      console.log(`[BATCH DEBUG] ✅ Batch ${batchIndex + 1}/${totalBatches} completed in ${batchDuration}ms (Promise.all took ${promiseDuration}ms)`);
      console.log(`[BATCH DEBUG] Batch ${batchIndex + 1} results: ${batchResults.filter(r => r.success).length} success, ${batchResults.filter(r => !r.success).length} failed`);

      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (shouldBatch && batchIndex < totalBatches - 1) {
        const delayStart = Date.now();
        console.log(`[BATCH DEBUG] Adding delay between batch ${batchIndex + 1} and ${batchIndex + 2}...`);
        await this.delayForRateLimit(provider.type);
        const delayEnd = Date.now();
        console.log(`[BATCH DEBUG] Delay completed in ${delayEnd - delayStart}ms`);
      }
    }

    // Log the bulk send operation  
    await this.logBulkEmailSend({
      providerId: provider._id.toString(),
      providerType: provider.type,
      totalRecipients: allEmailRecords.length,
      databaseRecipients: allEmailRecords.length, // All recipients are now in database
      directRecipients: 0, // No longer using direct mode
      successCount,
      failureCount,
      userId: user._id.toString(),
      emailIds: allEmailRecords.map(r => r._id.toString()),
      directEmails: [], // No direct emails anymore
      timestamp: new Date()
    });

    const processingTime = Date.now() - startTime;

    return {
      success: failureCount === 0,
      totalRecipients: allEmailRecords.length,
      successCount,
      failureCount,
      results,
      batchInfo: shouldBatch ? {
        totalBatches,
        processedBatches: totalBatches,
        batchSize
      } : undefined,
      processingTime
    };
  }

  /**
   * Add delay based on provider rate limits
   */
  private async delayForRateLimit(providerType: EmailServiceProviderType): Promise<void> {
    const delays = {
      [EmailServiceProviderType.SENDGRID]: 10, // 100 emails/second = 10ms delay
      [EmailServiceProviderType.MAILGUN]: 12, // ~83 emails/second
      [EmailServiceProviderType.ERPNEXT]: 100, // Conservative for self-hosted
      [EmailServiceProviderType.SMTP]: 50, // Conservative for SMTP
      [EmailServiceProviderType.AMAZON_SES]: 70, // ~14 emails/second for sandbox
      [EmailServiceProviderType.MAILCHIMP]: 100,
      [EmailServiceProviderType.POSTMARK]: 20, // 50 emails/second
    };

    const delay = delays[providerType] || 100;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Log bulk email send operation for audit purposes
   */
  private async logBulkEmailSend(logData: any): Promise<void> {
    // In a production environment, you would log this to a database or logging service
    console.log('Bulk Email Send Log:', logData);
    // TODO: Implement actual logging to database or external service
  }
} 