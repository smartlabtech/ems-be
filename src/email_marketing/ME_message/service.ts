import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import mongoose from 'mongoose';
import { ME_message, MEMessageDocument } from './schema';
import { CreateMEMessageDto } from './dto.create';
import { UpdateMEMessageDto } from './dto.update';
import { QueryMEMessageDto, SortTypeEnum } from './dto.query';
import { IMEMessage, IMEMessageResponse } from './interface';
import { UserDocument } from '../../schema';
import { ME_taggedBy, METaggedByDocument } from '../ME_taggedBy/schema';
import { ME_tag, METagDocument } from '../ME_tag/schema';
import { TaggedEntityType } from '../ME_taggedBy/enum';
import { ME_email, MEEmailDocument } from '../ME_email/schema';
import { EmailSource } from '../ME_email/enum';

@Injectable()
export class MEMessageService {
  constructor(
    @InjectModel(ME_message.name)
    private readonly messageModel: Model<MEMessageDocument>,
    @InjectModel(ME_taggedBy.name)
    private readonly taggedByModel: Model<METaggedByDocument>,
    @InjectModel(ME_tag.name)
    private readonly tagModel: Model<METagDocument>,
    @InjectModel(ME_email.name)
    private readonly emailModel: Model<MEEmailDocument>,
  ) { }

  // Helper method to extract email from "Name <email@example.com>" format
  private extractEmailAddress(emailString: string): string {
    // Check if the string contains angle brackets
    const match = emailString.match(/<(.+)>/);
    if (match && match[1]) {
      return match[1].trim();
    }
    // Otherwise, return the string as is (assuming it's already a plain email)
    return emailString.trim();
  }

  async create(data: CreateMEMessageDto, user: UserDocument): Promise<IMEMessage> {
    // Extract tags from DTO and convert from comma-separated string to array
    const { tags, to, cc, bcc, ...messageData } = data;

    // Convert comma-separated strings to arrays, handling empty strings and null
    const toArray = to ? to.split(',').map(email => email.trim()).filter(email => email) : [];
    const ccArray = (cc && cc !== "" && cc !== null) ? cc.split(',').map(email => email.trim()).filter(email => email) : [];
    const bccArray = (bcc && bcc !== "" && bcc !== null) ? bcc.split(',').map(email => email.trim()).filter(email => email) : [];

    // Handle tags - support both array and comma-separated string formats
    let tagsArray: string[] = [];
    if (tags && tags !== "" && tags !== null) {
      if (Array.isArray(tags)) {
        // If it's already an array, use it directly
        tagsArray = tags.filter(tag => tag && tag.trim());
      } else if (typeof tags === 'string') {
        // If it's a string, split by comma
        tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // Handle in_reply_to - treat empty string as undefined
    const inReplyTo = (messageData.in_reply_to && messageData.in_reply_to !== "" && messageData.in_reply_to !== null)
      ? messageData.in_reply_to
      : undefined;

    // Convert sent_or_received to lowercase
    if (messageData.sent_or_received) {
      messageData.sent_or_received = messageData.sent_or_received.toLowerCase();
    }

    // Parse the timestamp date from the payload
    const timestampDate = messageData.timestamp ? new Date(messageData.timestamp) : new Date();

    // Check if message status is "received" and handle sender email
    if (messageData.sent_or_received === 'received' && messageData.sender) {
      // Extract the email address from the sender string
      const senderEmail = this.extractEmailAddress(messageData.sender);

      // Check if sender exists in ME_email collection
      const existingSenderEmail = await this.emailModel.findOne({
        email: senderEmail,
        creator: user._id
      });

      // If sender doesn't exist, create new email with source="Out"
      if (!existingSenderEmail) {
        try {
          await this.emailModel.create({
            email: senderEmail,
            source: EmailSource.OUT,
            creator: user._id,
            createdAt: timestampDate,
            updatedAt: timestampDate,
          });
          console.log(`Created new email entry for sender: ${senderEmail} with source: Out`);
        } catch (error) {
          console.error(`Failed to create email entry for sender ${senderEmail}:`, error);
          // Don't fail message creation if email creation fails
        }
      }
    }

    // Generate message_id for each recipient
    const currentTime = Date.now();
    const messages: IMEMessage[] = [];

    // Create a message for each recipient
    for (const recipient of toArray) {
      // Use the provided message_id (required field)
      const messageId = messageData.message_id;

      const createData: any = {
        ...messageData,
        to: toArray,
        cc: ccArray,
        bcc: bccArray,
        in_reply_to: inReplyTo,
        creator: user._id,
        message_id: messageId,
        timestamp: timestampDate,
        createdAt: timestampDate,
        updatedAt: timestampDate, // Set updatedAt to match createdAt from payload
        // Set isRead based on sent_or_received status
        // Sent messages are automatically marked as read (sender already knows the content)
        // Received messages start as unread
        isRead: messageData.sent_or_received === 'sent' ? true : false,
      };

      // Debug metadata handling
      if (messageData.metadata) {
        console.log('Metadata type:', typeof messageData.metadata);
        console.log('Metadata value:', messageData.metadata);

        // Ensure metadata is always an object
        if (typeof messageData.metadata === 'string') {
          console.warn('Metadata is a string, this should not happen:', messageData.metadata);
          try {
            createData.metadata = JSON.parse(messageData.metadata);
          } catch (e) {
            console.error('Failed to parse metadata string, setting to empty object');
            createData.metadata = {};
          }
        } else if (typeof messageData.metadata === 'object' && messageData.metadata !== null) {
          createData.metadata = messageData.metadata;
        } else {
          createData.metadata = {};
        }
      }

      // Handle belongToMessageId based on in_reply_to
      if (inReplyTo) {
        // If in_reply_to exists, find the message with that message_id
        const parentMessage = await this.messageModel.findOne({
          message_id: inReplyTo,
          creator: user._id
        });

        if (parentMessage) {
          // If parent message has a belongToMessageId, use that to maintain thread continuity
          // Otherwise, use the parent message's _id
          createData.belongToMessageId = parentMessage.belongToMessageId || parentMessage._id;
        }
        // If parent message not found, belongToMessageId will be set to self after creation
      }

      // Ensure belongToMessageId is an ObjectId if it exists
      if (createData.belongToMessageId) {
        // If it's a populated object, extract the _id
        if (typeof createData.belongToMessageId === 'object' && createData.belongToMessageId._id) {
          createData.belongToMessageId = createData.belongToMessageId._id;
        }
        // Ensure it's a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(createData.belongToMessageId)) {
          delete createData.belongToMessageId; // Remove invalid belongToMessageId
        }
      }

      // Check if message already exists
      const existingMessage = await this.messageModel.findOne({
        message_id: messageId,
        creator: user._id
      });

      let newMessage;
      if (existingMessage) {
        // Update existing message, but preserve createdAt and isRead
        const { createdAt, isRead, ...updateData } = createData;
        newMessage = await this.messageModel.findOneAndUpdate(
          {
            message_id: messageId,
            creator: user._id
          },
          {
            $set: updateData
          },
          {
            new: true,
            runValidators: true
          }
        );
      } else {
        // Create new message
        newMessage = await this.messageModel.findOneAndUpdate(
          {
            message_id: messageId,
            creator: user._id
          },
          {
            $set: createData
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );
      }

      // If in_reply_to is empty/doesn't exist OR if parent message was not found, set belongToMessageId to self
      if (!inReplyTo || !createData.belongToMessageId) {
        await this.messageModel.findByIdAndUpdate(
          newMessage._id,
          { belongToMessageId: newMessage._id }
        );
      }

      // Handle tags if provided
      if (tagsArray && tagsArray.length > 0) {
        await this.handleTags(newMessage._id.toString(), tagsArray, user._id, timestampDate);
      }

      // Get the message with tags
      const messageWithTags = await this.findById(newMessage._id.toString(), user, false);
      messages.push(messageWithTags);
    }

    // Return the first message (for single recipient case)
    return messages[0];
  }

  async createBulk(messages: CreateMEMessageDto[], user: UserDocument): Promise<IMEMessage[]> {
    const results: IMEMessage[] = [];

    for (const message of messages) {
      const result = await this.create(message, user);
      results.push(result);
    }

    return results;
  }

  async findAll(query: QueryMEMessageDto, user: UserDocument): Promise<IMEMessageResponse> {
    const filter = await this.buildFilter(query, user);

    // Handle tag filtering
    if (query.tagIds) {
      const tagIdArray = query.tagIds.split(',').map(id => new Types.ObjectId(id.trim()));

      if (tagIdArray.length > 0) {
        const taggedByRecords = await this.taggedByModel.find({
          tagId: { $in: tagIdArray },
          entityType: TaggedEntityType.MESSAGE,
          creator: user._id,
          status: 'active'
        }).select('entityId');

        if (taggedByRecords.length > 0) {
          filter._id = { $in: taggedByRecords.map(tb => tb.entityId) };
        } else {
          // No messages have the specified tags, return empty result
          return {
            data: [],
            total: 0,
            page: query.page ?? 1,
            size: query.size ?? 20,
          };
        }
      }
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const skip = (page - 1) * size;

    // Build sort object
    const sort: any = {};
    if (query.orderBy && query.sortType) {
      sort[query.orderBy] = query.sortType === SortTypeEnum.ASCENDING ? 1 : -1;
    } else {
      sort.timestamp = -1; // Default sort by timestamp descending
    }

    const [messages, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(size)
        .populate('creator', 'name email')
        .exec(),
      this.messageModel.countDocuments(filter)
    ]);

    // Get tags for each message
    const messagesWithTags = await Promise.all(
      messages.map(async (message) => {
        try {
          // Get taggedBy records for this message
          const taggedByRecords = await this.taggedByModel
            .find({
              entityType: TaggedEntityType.MESSAGE,
              entityId: message._id,
              creator: user._id,
              status: 'active'
            })
            .select('tagId')
            .exec();

          // Get the tag IDs
          const tagIds = taggedByRecords.map(tb => tb.tagId);

          // Get the actual tags
          let tags = [];
          if (tagIds.length > 0) {
            const tagDocuments = await this.tagModel
              .find({
                _id: { $in: tagIds },
                status: 'active'
              })
              .select('_id name status')
              .exec();

            tags = tagDocuments.map(tag => ({
              id: tag._id.toString(),
              name: tag.name,
              status: tag.status
            }));
          }

          const messageInterface = {
            ...this.toInterface(message),
            tags
          };

          // Populate related messages if requested
          if (query.includeRelated) {
            await this.populateRelatedMessages(messageInterface, user);
          }

          return messageInterface;
        } catch (err) {
          console.error(`Error getting tags for message ${message._id}:`, err);
          return {
            ...this.toInterface(message),
            tags: []
          };
        }
      })
    );

    return {
      data: messagesWithTags,
      total,
      page,
      size,
    };
  }

  async findById(id: string, user: UserDocument, includeRelated: boolean = false): Promise<IMEMessage> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel
      .findOne({ _id: id, creator: user._id })
      .populate('creator', 'name email')
      .exec();

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Get tags for the message
    const taggedByRecords = await this.taggedByModel
      .find({
        entityType: TaggedEntityType.MESSAGE,
        entityId: message._id,
        creator: user._id,
        status: 'active'
      })
      .select('tagId')
      .exec();

    const tagIds = taggedByRecords.map(tb => tb.tagId);
    let tags = [];

    if (tagIds.length > 0) {
      const tagDocuments = await this.tagModel
        .find({
          _id: { $in: tagIds },
          status: 'active'
        })
        .select('_id name status')
        .exec();

      tags = tagDocuments.map(tag => ({
        id: tag._id.toString(),
        name: tag.name,
        status: tag.status
      }));
    }

    const messageInterface = {
      ...this.toInterface(message),
      tags
    };

    // Populate related messages if requested
    if (includeRelated) {
      await this.populateRelatedMessages(messageInterface, user);
    }

    return messageInterface;
  }

  async findByMessageId(messageId: string, user: UserDocument): Promise<IMEMessage> {
    const message = await this.messageModel
      .findOne({ message_id: messageId, creator: user._id })
      .populate('creator', 'name email')
      .exec();

    if (!message) {
      throw new NotFoundException(`Message with message_id ${messageId} not found`);
    }

    return this.toInterface(message);
  }

  async update(id: string, data: UpdateMEMessageDto, user: UserDocument): Promise<IMEMessage> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel.findOne({ _id: id, creator: user._id });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Extract tags from DTO and convert other fields
    const { tags, to, cc, bcc, in_reply_to, ...messageData } = data;

    // Convert comma-separated strings to arrays if provided, handling empty strings and null
    const updateData: any = { ...messageData };

    // Remove isRead from updateData to preserve existing value
    delete updateData.isRead;

    if (to !== undefined) {
      updateData.to = to ? to.split(',').map(email => email.trim()).filter(email => email) : [];
    }

    if (cc !== undefined) {
      updateData.cc = (cc && cc !== "" && cc !== null) ? cc.split(',').map(email => email.trim()).filter(email => email) : [];
    }

    if (bcc !== undefined) {
      updateData.bcc = (bcc && bcc !== "" && bcc !== null) ? bcc.split(',').map(email => email.trim()).filter(email => email) : [];
    }

    if (in_reply_to !== undefined) {
      updateData.in_reply_to = (in_reply_to && in_reply_to !== "" && in_reply_to !== null) ? in_reply_to : undefined;
    }

    // Convert sent_or_received to lowercase if provided
    if (messageData.sent_or_received !== undefined && messageData.sent_or_received) {
      updateData.sent_or_received = messageData.sent_or_received.toLowerCase();
    }

    const updatedMessage = await this.messageModel.findByIdAndUpdate(
      id,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    ).populate('creator', 'name email');

    if (!updatedMessage) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Handle tags if provided (replace existing tags)
    if (tags !== undefined) {
      // Handle tags - support both array and comma-separated string formats
      let tagsArray: string[] = [];
      if (tags && tags !== "" && tags !== null) {
        if (Array.isArray(tags)) {
          // If it's already an array, use it directly
          tagsArray = tags.filter(tag => tag && tag.trim());
        } else if (typeof tags === 'string') {
          // If it's a string, split by comma
          tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      }

      // Remove all existing tags for this message
      await this.taggedByModel.deleteMany({
        entityType: TaggedEntityType.MESSAGE,
        entityId: id,
        creator: user._id
      });

      // Add new tags if any
      if (tagsArray && tagsArray.length > 0) {
        await this.handleTags(id, tagsArray, user._id);
      }
    }

    // Return message with tags
    return this.findById(id, user, false);
  }

  async markAsRead(id: string, user: UserDocument): Promise<IMEMessage> {
    const message = await this.messageModel.findOneAndUpdate(
      { _id: id, creator: user._id },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      },
      { new: true }
    ).populate('creator', 'name email');

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return this.toInterface(message);
  }

  async delete(id: string, user: UserDocument): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel.findOne({ _id: id, creator: user._id });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Delete all taggedBy records associated with this message
    await this.taggedByModel.deleteMany({
      entityType: TaggedEntityType.MESSAGE,
      entityId: id,
      creator: user._id
    });

    await this.messageModel.findByIdAndDelete(id);
  }

  async getThreadMessages(threadId: string, user: UserDocument): Promise<IMEMessage[]> {
    // First, find the root message to get its belongToMessageId
    const rootMessage = await this.messageModel
      .findOne({ _id: threadId, creator: user._id })
      .exec();

    if (!rootMessage) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    const belongToId = rootMessage.belongToMessageId || rootMessage._id;

    // Find all messages with the same belongToMessageId
    const messages = await this.messageModel
      .find({
        belongToMessageId: belongToId,
        creator: user._id
      })
      .sort({ timestamp: 1 }) // Sort oldest to latest
      .populate('creator', 'name email')
      .exec();

    // Convert to interface and mark the latest message
    const messagesInterface = messages.map(message => this.toInterface(message));

    // Mark the latest message
    if (messagesInterface.length > 0) {
      messagesInterface[messagesInterface.length - 1].isLatestInThread = true;
    }

    return messagesInterface;
  }

  private async buildFilter(query: QueryMEMessageDto, user: UserDocument): Promise<any> {
    const filter: any = { creator: user._id };

    // Handle different $or conditions separately then combine them
    const orConditions = [];

    if (query.search) {
      orConditions.push({
        $or: [
          { subject: { $regex: query.search, $options: 'i' } },
          { message: { $regex: query.search, $options: 'i' } },
        ]
      });
    }

    // Specific sender filter
    if (query.sender) {
      filter.sender = query.sender;
    }

    // Specific recipient filter (overridden by email filter if present)
    if (query.recipient && !query.email) {
      orConditions.push({
        $or: [
          { to: query.recipient },
          { cc: query.recipient },
          { bcc: query.recipient }
        ]
      });
    }

    // Combined email filter - matches either sender or any recipient field
    if (query.email) {
      orConditions.push({
        $or: [
          { sender: query.email },
          { to: query.email },
          { cc: query.email },
          { bcc: query.email }
        ]
      });
    }

    // Combine all OR conditions with AND logic
    if (orConditions.length > 0) {
      if (orConditions.length === 1) {
        Object.assign(filter, orConditions[0]);
      } else {
        filter.$and = orConditions;
      }
    }

    if (query.sent_or_received) {
      filter.sent_or_received = query.sent_or_received.toLowerCase();
    }

    if (query.delivery_status) {
      filter.delivery_status = query.delivery_status;
    }

    if (query.contentType) {
      filter.contentType = query.contentType;
    }

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    if (query.belongToMessageId) {
      filter.belongToMessageId = query.belongToMessageId;
    }

    // Date range filters
    if (query.timestampFrom || query.timestampTo) {
      filter.timestamp = {};
      if (query.timestampFrom) filter.timestamp.$gte = new Date(query.timestampFrom);
      if (query.timestampTo) filter.timestamp.$lte = new Date(query.timestampTo);
    }

    if (query.createdFrom || query.createdTo) {
      filter.createdAt = {};
      if (query.createdFrom) filter.createdAt.$gte = new Date(query.createdFrom);
      if (query.createdTo) filter.createdAt.$lte = new Date(query.createdTo);
    }

    return filter;
  }

  private toInterface(doc: MEMessageDocument): IMEMessage {
    if (!doc) return null;

    // Access the underlying mongoose document to get timestamps
    const docObj = doc as any;

    // Handle belongToMessageId - ensure it's always a string ID
    let belongToMessageId: string | undefined;
    if (doc.belongToMessageId) {
      const belongToField = doc.belongToMessageId as any;

      // Check if it's a string that looks like a stringified object
      if (typeof belongToField === 'string') {
        // Check if it's already a valid ObjectId string (24 hex chars)
        if (/^[a-f0-9]{24}$/i.test(belongToField)) {
          belongToMessageId = belongToField;
        } else if (belongToField.includes('ObjectId')) {
          // Try to extract the ObjectId from the stringified object
          // Match patterns like: new ObjectId("...") or ObjectId("...")
          const match = belongToField.match(/ObjectId\("([a-f0-9]{24})"\)/i);
          if (match && match[1]) {
            belongToMessageId = match[1];
          }
        }
      } else if (typeof belongToField === 'object' && belongToField._id) {
        // If it's a populated object, extract the _id
        belongToMessageId = belongToField._id.toString();
      } else if (mongoose.Types.ObjectId.isValid(belongToField)) {
        // If it's a valid ObjectId, convert to string
        belongToMessageId = belongToField.toString();
      }
    }

    return {
      _id: doc._id.toString(),
      creator: typeof doc.creator === 'object' && (doc.creator as any)._id
        ? (doc.creator as any)._id.toString()
        : doc.creator.toString(),
      sender: doc.sender,
      message_id: doc.message_id,
      in_reply_to: doc.in_reply_to,
      references: doc.references || [],
      subject: doc.subject,
      message: doc.message,
      contentType: doc.contentType,
      to: doc.to || [],
      cc: doc.cc || [],
      bcc: doc.bcc || [],
      belongToMessageId: belongToMessageId,
      sent_or_received: doc.sent_or_received,
      delivery_status: doc.delivery_status,
      timestamp: doc.timestamp,
      readAt: doc.readAt,
      isRead: doc.isRead || false,
      providerId: doc.providerId,
      providerMessageId: doc.providerMessageId,
      headers: doc.headers,
      attachments: doc.attachments,
      metadata: doc.metadata,
      error: doc.error,
      retryCount: doc.retryCount || 0,
      lastRetryAt: doc.lastRetryAt,
      messageData: doc.messageData,
      createdAt: docObj.createdAt,
      updatedAt: docObj.updatedAt,
    };
  }

  // New helper method to handle tag creation and assignment
  private async handleTags(entityId: string, tagNames: string[], userId: any, timestampDate?: Date): Promise<void> {
    for (const tagName of tagNames) {
      if (!tagName || tagName.trim() === '') continue;

      // Check if tag exists for this user and type
      let tag = await this.tagModel.findOne({
        name: tagName.trim(),
        type: 'message',
        creator: userId
      });

      // Create tag if it doesn't exist
      if (!tag) {
        const tagDate = timestampDate || new Date();
        tag = await this.tagModel.create({
          name: tagName.trim(),
          type: 'message',
          creator: userId,
          createdAt: tagDate,
          updatedAt: tagDate,
        });
      }

      // Check if taggedBy relation already exists
      const existingTaggedBy = await this.taggedByModel.findOne({
        entityType: TaggedEntityType.MESSAGE,
        entityId,
        tagId: tag._id,
        creator: userId
      });

      // Create taggedBy relation if it doesn't exist
      if (!existingTaggedBy) {
        const taggedByDate = timestampDate || new Date();
        await this.taggedByModel.create({
          entityType: TaggedEntityType.MESSAGE,
          entityId,
          tagId: tag._id,
          creator: userId,
          createdAt: taggedByDate,
          updatedAt: taggedByDate,
        });
      }
    }
  }

  // Add this method to clean up existing data
  async cleanupBelongToMessageId(user: UserDocument): Promise<{ fixed: number; failed: number }> {
    let fixed = 0;
    let failed = 0;

    try {
      // Find all messages with problematic belongToMessageId
      const messages = await this.messageModel.find({
        creator: user._id,
        belongToMessageId: { $type: 'string' } // Find where it's stored as string
      }).exec();

      console.log(`Found ${messages.length} messages with string belongToMessageId`);

      for (const message of messages) {
        try {
          const belongToField = message.belongToMessageId as any;
          let extractedId: string | null = null;

          if (typeof belongToField === 'string') {
            // Check if it's already a valid ObjectId string (24 hex chars)
            if (/^[a-f0-9]{24}$/i.test(belongToField)) {
              extractedId = belongToField;
            } else if (belongToField.includes('ObjectId')) {
              // Try to extract the ObjectId from the stringified object
              // Match patterns like: new ObjectId("...") or ObjectId("...")
              const match = belongToField.match(/ObjectId\("([a-f0-9]{24})"\)/i);
              if (match && match[1]) {
                extractedId = match[1];
              }
            }
          }

          if (extractedId && mongoose.Types.ObjectId.isValid(extractedId)) {
            // Update the record with the proper ObjectId
            await this.messageModel.updateOne(
              { _id: message._id },
              { $set: { belongToMessageId: new mongoose.Types.ObjectId(extractedId) } }
            );
            fixed++;
            console.log(`Fixed message ${message._id}: extracted ID ${extractedId}`);
          } else {
            // If we can't extract a valid ID, set it to self
            await this.messageModel.updateOne(
              { _id: message._id },
              { $set: { belongToMessageId: message._id } }
            );
            fixed++;
            console.log(`Fixed message ${message._id}: set to self`);
          }
        } catch (error) {
          console.error(`Failed to fix message ${message._id}:`, error);
          failed++;
        }
      }

      console.log(`Cleanup completed: Fixed ${fixed} messages, Failed ${failed}`);
      return { fixed, failed };
    } catch (error) {
      console.error('Error in cleanupBelongToMessageId:', error);
      throw error;
    }
  }

  // Helper method to populate related messages
  private async populateRelatedMessages(message: IMEMessage, user: UserDocument): Promise<void> {
    if (!message.belongToMessageId) return;

    // Find all messages with the same belongToMessageId (including self)
    const relatedMessages = await this.messageModel
      .find({
        belongToMessageId: message.belongToMessageId,
        creator: user._id
      })
      .sort({ timestamp: 1 }) // Sort oldest to latest
      .populate('creator', 'name email')
      .exec();

    // Convert to interface and fetch tags for each related message
    message.relatedMessages = await Promise.all(
      relatedMessages.map(async (msg) => {
        try {
          // Get tags for each related message
          const taggedByRecords = await this.taggedByModel
            .find({
              entityType: TaggedEntityType.MESSAGE,
              entityId: msg._id,
              creator: user._id,
              status: 'active'
            })
            .select('tagId')
            .exec();

          const tagIds = taggedByRecords.map(tb => tb.tagId);
          let tags = [];

          if (tagIds.length > 0) {
            const tagDocuments = await this.tagModel
              .find({
                _id: { $in: tagIds },
                status: 'active'
              })
              .select('_id name status')
              .exec();

            tags = tagDocuments.map(tag => ({
              id: tag._id.toString(),
              name: tag.name,
              status: tag.status
            }));
          }

          return {
            ...this.toInterface(msg),
            tags
          };
        } catch (err) {
          console.error(`Error getting tags for related message ${msg._id}:`, err);
          return {
            ...this.toInterface(msg),
            tags: []
          };
        }
      })
    );

    // Check if this is the latest message in the thread
    if (relatedMessages.length > 0) {
      const latestMessage = relatedMessages[relatedMessages.length - 1];
      message.isLatestInThread = latestMessage._id.toString() === message._id;
    } else {
      message.isLatestInThread = true;
    }
  }



  async getLatestMessagesPerThread(query: QueryMEMessageDto, user: UserDocument): Promise<IMEMessageResponse> {
    try {
      const baseFilter = await this.buildFilter(query, user);
      
      // Build match conditions - ensure creator is ObjectId for aggregation
      const matchConditions: any = {
        ...baseFilter
      };
      
      // Convert creator to ObjectId if it exists
      if (matchConditions.creator) {
        matchConditions.creator = new mongoose.Types.ObjectId(matchConditions.creator);
      }

      // Handle tag filtering
      if (query.tagIds) {
        const tagIdArray = query.tagIds.split(',').map(id => new Types.ObjectId(id.trim()));
        
        if (tagIdArray.length > 0) {
          const taggedByRecords = await this.taggedByModel.find({
            tagId: { $in: tagIdArray },
            entityType: TaggedEntityType.MESSAGE,
            creator: user._id,
            status: 'active'
          }).select('entityId').lean();
          
          if (taggedByRecords.length > 0) {
            matchConditions._id = { $in: taggedByRecords.map(tb => tb.entityId) };
          } else {
            return {
              data: [],
              total: 0,
              page: query.page ?? 1,
              size: query.size ?? 20,
            };
          }
        }
      }

      const page = Number(query.page ?? 1);
      const size = Number(query.size ?? 20);
      const skip = (page - 1) * size;

      const pipeline: any[] = [
        { $match: matchConditions },
        { $sort: { timestamp: -1, createdAt: -1 } },
        {
          $group: {
            _id: "$belongToMessageId",
            doc: { $first: "$$ROOT" }
          }
        },
        { $sort: { "doc.timestamp": -1 } },
        {
          $facet: {
            total: [{ $count: "count" }],
            data: [
              { $skip: skip },
              { $limit: size },
              { $replaceRoot: { newRoot: "$doc" } }
            ]
          }
        }
      ];

      let messages: any[] = [];
      let total = 0;

      try {
        const [aggregationResult] = await this.messageModel
          .aggregate(pipeline)
          .allowDiskUse(true)
          .exec();
        
        messages = aggregationResult?.data || [];
        total = aggregationResult?.total?.[0]?.count || 0;
      } catch (aggError) {
        console.error('Aggregation pipeline error:', aggError);
        console.error('Error details:', {
          name: aggError.name,
          message: aggError.message,
          code: aggError.code,
          codeName: aggError.codeName
        });
        
        // Fallback to simple query if aggregation fails
        console.log('Falling back to simple query...');
        const simpleMessages = await this.messageModel
          .find(matchConditions)
          .sort({ timestamp: -1 })
          .limit(size)
          .skip(skip)
          .populate('creator', 'name email')
          .exec();
          
        console.log('Simple query returned', simpleMessages.length, 'messages');
        
        // Return simple messages without thread grouping
        const messagesWithTags = await Promise.all(
          simpleMessages.map(async (message) => {
            const messageInterface = {
              ...this.toInterface(message),
              tags: [],
              isLatestInThread: true
            };
            return messageInterface;
          })
        );
        
        return {
          data: messagesWithTags,
          total: await this.messageModel.countDocuments(matchConditions),
          page,
          size,
        };
      }
      
      if (messages.length === 0) {
        console.log('No messages found after aggregation');
        return {
          data: [],
          total,
          page,
          size,
        };
      }
      

      // Populate creator information
      const messageIds = messages.map(m => m._id);
      const populatedMessages = await this.messageModel
        .find({ _id: { $in: messageIds } })
        .populate('creator', 'name email')
        .lean()
        .exec();
      
      // Create map for quick lookup
      const messageMap = new Map(populatedMessages.map(m => [m._id.toString(), m]));
      const orderedMessages = messages
        .map(m => messageMap.get(m._id.toString()))
        .filter(Boolean);

      // Get tags for messages
      const taggedByRecords = await this.taggedByModel
        .find({
          entityType: TaggedEntityType.MESSAGE,
          entityId: { $in: messageIds },
          creator: user._id,
          status: 'active'
        })
        .populate({
          path: 'tagId',
          match: { status: 'active' },
          select: '_id name status'
        })
        .lean()
        .exec();

      // Create tags map
      const tagsByMessageId = new Map<string, any[]>();
      taggedByRecords.forEach(record => {
        if (record.tagId) {
          const messageId = record.entityId.toString();
          if (!tagsByMessageId.has(messageId)) {
            tagsByMessageId.set(messageId, []);
          }
          tagsByMessageId.get(messageId)!.push({
            id: (record.tagId as any)._id.toString(),
            name: (record.tagId as any).name,
            status: (record.tagId as any).status
          });
        }
      });

      // Process messages
      const processedMessages = await Promise.all(
        orderedMessages.map(async (message) => {
          const messageInterface = {
            ...this.toInterface(message),
            tags: tagsByMessageId.get(message._id.toString()) || [],
            isLatestInThread: true
          };

          if (query.includeRelated) {
            await this.populateRelatedMessages(messageInterface, user);
          }

          return messageInterface;
        })
      );

      const response = {
        data: processedMessages,
        total,
        page,
        size,
      };
      
      return response;
    } catch (error) {
      console.error('Error in getLatestMessagesPerThread:', error);
      throw new InternalServerErrorException('Failed to fetch latest messages per thread');
    }
  }

  // Debug method to check belongToMessageId values
  async debugBelongToMessageId(user: UserDocument): Promise<any> {
    try {
      // Get a sample of messages
      const messages = await this.messageModel
        .find({ creator: user._id })
        .limit(10)
        .select('_id message_id belongToMessageId createdAt')
        .exec();

      const debugInfo = messages.map(msg => {
        const msgObj = msg.toObject();
        const belongTo = msgObj.belongToMessageId as any;
        let belongToType = typeof belongTo;
        let isValidObjectId = false;
        let stringLength: number | null = null;

        if (belongTo) {
          const belongToStr = typeof belongTo === 'string' ? belongTo : null;
          if (belongToStr) {
            isValidObjectId = /^[a-f0-9]{24}$/i.test(belongToStr);
            stringLength = belongToStr.length;
          } else if (belongTo && typeof belongTo === 'object' && 'toString' in belongTo) {
            const stringValue = belongTo.toString();
            isValidObjectId = /^[a-f0-9]{24}$/i.test(stringValue);
          }
        }

        return {
          _id: msgObj._id.toString(),
          message_id: msgObj.message_id,
          belongToMessageId: belongTo ? belongTo.toString() : null,
          belongToType,
          isString: typeof belongTo === 'string',
          isValidObjectId,
          stringLength,
          createdAt: msgObj.createdAt
        };
      });

      // Count messages with different conditions
      const counts = {
        withBelongTo: await this.messageModel.countDocuments({
          creator: user._id,
          belongToMessageId: { $exists: true, $ne: null }
        }),
        withoutBelongTo: await this.messageModel.countDocuments({
          creator: user._id,
          belongToMessageId: { $exists: false }
        }),
        nullBelongTo: await this.messageModel.countDocuments({
          creator: user._id,
          belongToMessageId: null
        })
      };

      return {
        sample: debugInfo,
        counts,
        totalMessages: await this.messageModel.countDocuments({ creator: user._id })
      };
    } catch (error) {
      console.error('Debug error:', error);
      throw error;
    }
  }


  // Add debug method for thread summary
  async debugThreadSummary(user: UserDocument): Promise<any> {
    try {
      // Get sample of ALL messages to understand data structure
      const allMessages = await this.messageModel
        .find({ creator: user._id })
        .select('_id message_id belongToMessageId createdAt subject timestamp')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .exec();

      // Get messages with belongToMessageId
      const messagesWithBelongTo = await this.messageModel
        .find({
          creator: user._id,
          belongToMessageId: { $exists: true, $ne: null }
        })
        .select('_id message_id belongToMessageId createdAt subject timestamp')
        .sort({ timestamp: -1 })
        .limit(20)
        .exec();

      // Group by belongToMessageId
      const threadGroups = {};
      messagesWithBelongTo.forEach(msg => {
        const belongToId = msg.belongToMessageId.toString();
        if (!threadGroups[belongToId]) {
          threadGroups[belongToId] = [];
        }
        threadGroups[belongToId].push({
          _id: msg._id.toString(),
          message_id: msg.message_id,
          subject: msg.subject,
          createdAt: msg.createdAt
        });
      });

      // Get thread summary
      const threadSummary = Object.entries(threadGroups).map(([threadId, messages]: [string, any[]]) => ({
        threadId,
        messageCount: messages.length,
        latestMessage: messages[0], // Already sorted by createdAt desc
        messages: messages
      }));

      // Check for root messages (where belongToMessageId = _id)
      const rootMessages = allMessages.filter(msg => {
        if (!msg.belongToMessageId) return false;
        return msg._id.toString() === msg.belongToMessageId.toString();
      });

      // Check data integrity
      const dataIntegrity = {
        totalMessages: await this.messageModel.countDocuments({ creator: user._id }),
        messagesWithBelongTo: messagesWithBelongTo.length,
        messagesWithoutBelongTo: allMessages.filter(msg => !msg.belongToMessageId).length,
        rootMessages: rootMessages.length,
        sampleMessages: allMessages.map(msg => ({
          _id: msg._id.toString(),
          belongToMessageId: msg.belongToMessageId ? msg.belongToMessageId.toString() : null,
          isRoot: msg.belongToMessageId && msg._id.toString() === msg.belongToMessageId.toString(),
          subject: msg.subject
        }))
      };

      return {
        dataIntegrity,
        totalThreads: Object.keys(threadGroups).length,
        threadsShown: threadSummary.length,
        threads: threadSummary.slice(0, 5), // Show only first 5 threads
        totalMessagesWithBelongTo: messagesWithBelongTo.length
      };
    } catch (error) {
      console.error('Debug thread summary error:', error);
      throw error;
    }
  }
} 