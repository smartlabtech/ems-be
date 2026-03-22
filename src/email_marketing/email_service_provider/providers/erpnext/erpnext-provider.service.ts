// File: src/email_marketing/email_service_provider/providers/erpnext/erpnext-provider.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { BaseEmailProviderService } from '../base/base-provider.service';
import {
  IEmailProviderConfig,
  IEmailProviderTestResult,
  IEmailProviderResponse,
  IEmailSendOptions
} from '../base/base-provider.interface';

@Injectable()
export class ERPNextProviderService extends BaseEmailProviderService {

  async testConfiguration(config: IEmailProviderConfig): Promise<IEmailProviderTestResult> {
    try {
      console.log('Testing ERPNext configuration...');

      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Invalid configuration',
          error: 'Missing required fields: baseUrl and token'
        };
      }

      // Test API connectivity by fetching email accounts
      const response = await axios.get(`${config.baseUrl}/api/resource/Email Account`, {
        headers: {
          'Authorization': `token ${config.token}`,
        },
        params: {
          limit_page_length: 500 // Same as fetchEmailAccounts to get accurate count
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        const emailAccounts = response.data?.data || [];
        return {
          success: true,
          message: `Successfully connected to ERPNext. Found ${emailAccounts.length} email account(s)`,
          details: { emailAccountsCount: emailAccounts.length }
        };
      }

      return {
        success: false,
        message: 'Failed to connect to ERPNext',
        error: `Unexpected status code: ${response.status}`
      };
    } catch (error) {
      console.error('ERPNext configuration test error:', error);
      return this.formatTestErrorResponse(error);
    }
  }

  async sendEmail(config: IEmailProviderConfig, options: IEmailSendOptions): Promise<IEmailProviderResponse> {
    try {
      console.log('Sending email via ERPNext...');

      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: 'Invalid configuration: Missing required fields'
        };
      }
      // Build the payload in the exact format ERPNext expects
      const payload = {
        recipients: this.normalizeEmailAddresses(options.to).join(','),
        subject: options.subject,
        content: options.html || options.text || '',
        communication_doctype: "User",
        communication_name: "Administrator",
        send_email: true,
        content_type: options.html ? "html" : "text",
        sender: options.from,
      };

      // Add optional fields if provided
      if (options.cc) {
        (payload as any).cc = this.normalizeEmailAddresses(options.cc).join(',');
      }

      if (options.bcc) {
        (payload as any).bcc = this.normalizeEmailAddresses(options.bcc).join(',');
      }

      // Note: in_reply_to and references are handled via PUT request after creation
      // ERPNext doesn't accept these fields in the initial create request

      console.log('Sending email with payload:', {
        ...payload,
        content: payload.content ? '[content hidden]' : undefined
      });

      const response = await axios.post(
        `${config.baseUrl}/api/method/frappe.core.doctype.communication.email.make`,
        payload,
        {
          headers: {
            'Authorization': `token ${config.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data) {
        // Extract the communication ID from response
        const communicationId = response.data.message?.name || response.data.name;

        if (communicationId && communicationId !== 'sent') {
          try {
            // If in_reply_to is provided, update the communication with it
            if (options.in_reply_to) {
              console.log(`Updating communication ${communicationId} with in_reply_to: ${options.in_reply_to}`);
              
              // Extract doctype from the response - it's usually in the message or data
              const doctype = response.data.message?.doctype || response.data.doctype || 'Communication';
              
              const updatePayload = {
                in_reply_to: options.in_reply_to,
                reference_doctype: doctype,
                reference_name: options.in_reply_to
              };
              
              console.log('Updating communication with payload:', updatePayload);
              
              const updateResponse = await axios.put(
                `${config.baseUrl}/api/resource/Communication/${communicationId}`,
                updatePayload,
                {
                  headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json',
                  },
                  timeout: 10000,
                }
              );
              
              if (updateResponse.status !== 200) {
                console.warn('Failed to update in_reply_to field, but email was sent successfully');
              }
            }

            // Fetch full communication details
            console.log(`Fetching communication details for ID: ${communicationId}`);

            const detailsResponse = await axios.get(
              `${config.baseUrl}/api/resource/Communication/${communicationId}`,
              {
                headers: {
                  'Authorization': `token ${config.token}`,
                  'Content-Type': 'application/json',
                },
                timeout: 10000,
              }
            );

            if (detailsResponse.data?.data) {
              const communicationData = detailsResponse.data.data;
              console.log('Communication data:', communicationData);
              return {
                success: true,
                messageId: communicationData.message_id || communicationId, // Use ERPNext's message_id
                details: {
                  communicationId: communicationId,
                  erpnextMessageId: communicationId,//communicationData.message_id,
                  fullData: communicationData
                }
              };
            }
          } catch (detailError) {
            console.error('Failed to fetch communication details:', detailError);
            // Continue with basic response if fetching details fails
          }
        }

        return {
          success: true,
          messageId: communicationId || 'sent',
          details: response.data
        };
      }

      return {
        success: false,
        error: 'Failed to send email via ERPNext'
      };
    } catch (error) {
      console.error('ERPNext send email error:', error);

      // Extract specific error message from ERPNext response
      if (error.response?.data?.exception) {
        const erpnextError = error.response.data.exception;
        return {
          success: false,
          error: `ERPNext Error: ${erpnextError}`,
          details: error.response.data
        };
      }

      if (error.response?.data?.exc) {
        return {
          success: false,
          error: 'ERPNext Error: Check ERPNext logs for details',
          details: error.response.data
        };
      }

      return this.formatErrorResponse(error);
    }
  }

  async fetchEmailAccounts(config: IEmailProviderConfig): Promise<any[]> {
    if (!this.validateConfig(config)) {
      throw new InternalServerErrorException('Invalid configuration for fetching email accounts');
    }

    try {
      console.log('Fetching email account names from ERPNext...');

      // Step 1: Get the list of email account names
      const listResponse = await axios.get(`${config.baseUrl}/api/resource/Email Account`, {
        headers: {
          'Authorization': `token ${config.token}`,
        },
        params: {
          fields: JSON.stringify(["name", "email_id", "email_account_name"]),
          limit_page_length: 500
        },
        timeout: 10000,
      });

      if (!listResponse.data?.data || !Array.isArray(listResponse.data.data)) {
        throw new InternalServerErrorException('Invalid response format from ERPNext');
      }

      const emailAccountNames = listResponse.data.data;
      console.log(`Found ${emailAccountNames.length} email accounts`);

      // Step 2: Decide whether to fetch detailed data based on account count
      const validAccounts = emailAccountNames.filter(account => account.name);
      
      // If too many accounts, skip detailed fetching to avoid timeout
      const MAX_ACCOUNTS_FOR_DETAILS = 30;
      
      if (validAccounts.length > MAX_ACCOUNTS_FOR_DETAILS) {
        console.log(`Found ${validAccounts.length} accounts - too many for detailed fetch. Using basic info only.`);
        
        // Return basic information from the list response
        const basicAccounts = validAccounts.map(account => ({
          sender: account.email_id || account.name,
          meta: {
            name: account.name,
            email_account_name: account.email_account_name || account.name,
            email_id: account.email_id,
            note: 'Details not fetched due to large number of accounts'
          }
        }));
        
        return basicAccounts;
      }
      
      // For reasonable number of accounts, fetch details with optimized batching
      console.log(`Fetching detailed data for ${validAccounts.length} accounts`);
      
      // Dynamic batch size based on total accounts
      const BATCH_SIZE = validAccounts.length <= 10 ? 5 : 10; // Larger batches for more accounts
      const detailedAccounts = [];
      const MAX_DETAIL_TIME = 8000; // 8 seconds max for all detail fetching
      const startTime = Date.now();
      
      for (let i = 0; i < validAccounts.length; i += BATCH_SIZE) {
        // Check if we're approaching timeout
        if (Date.now() - startTime > MAX_DETAIL_TIME) {
          console.log('Approaching timeout limit - returning partial results');
          
          // Add remaining accounts with basic info
          const remainingAccounts = validAccounts.slice(i).map(account => ({
            sender: account.email_id || account.name,
            meta: {
              name: account.name,
              email_account_name: account.email_account_name || account.name,
              email_id: account.email_id,
              note: 'Details not fetched due to timeout'
            }
          }));
          
          detailedAccounts.push(...remainingAccounts);
          break;
        }
        
        const batch = validAccounts.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validAccounts.length / BATCH_SIZE)}`);
        
        const batchPromises = batch.map(async (account) => {
          try {
            const detailResponse = await axios.get(
              `${config.baseUrl}/api/resource/Email Account/${encodeURIComponent(account.name)}`,
              {
                headers: {
                  'Authorization': `token ${config.token}`,
                },
                timeout: 2000, // Even shorter timeout for individual requests
              }
            );

            if (detailResponse.data?.data) {
              const accountData = detailResponse.data.data;

              // Transform to expected format
              return {
                sender: accountData.email_id || accountData.default_sender || account.email_id || account.name,
                meta: {
                  name: account.name,
                  email_account_name: accountData.email_account_name || account.name,
                  email_id: accountData.email_id,
                  default_sender: accountData.default_sender,
                  enable_outgoing: accountData.enable_outgoing,
                  use_tls: accountData.use_tls,
                  use_ssl: accountData.use_ssl,
                  smtp_server: accountData.smtp_server,
                  smtp_port: accountData.smtp_port,
                }
              };
            }
          } catch (detailError) {
            // Return basic info on error
            return {
              sender: account.email_id || account.name,
              meta: {
                name: account.name,
                email_id: account.email_id,
                error: 'Failed to fetch details',
                errorMessage: detailError.message
              }
            };
          }
        });
        
        // Wait for the batch to complete with a timeout
        try {
          const batchResults = await Promise.race([
            Promise.all(batchPromises),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Batch timeout')), 3000)
            )
          ]) as any[];
          
          detailedAccounts.push(...batchResults.filter(result => result));
        } catch (batchError) {
          console.error('Batch processing error:', batchError.message);
          // Add basic info for failed batch
          batch.forEach(account => {
            detailedAccounts.push({
              sender: account.email_id || account.name,
              meta: {
                name: account.name,
                email_id: account.email_id,
                error: 'Batch processing failed'
              }
            });
          });
        }
      }

      console.log(`Successfully fetched details for ${detailedAccounts.length} email accounts`);
      return detailedAccounts;

    } catch (error) {
      console.error('Error fetching email accounts:', error);
      throw new InternalServerErrorException('Failed to fetch email accounts from ERPNext');
    }
  }

  validateConfig(config: IEmailProviderConfig): boolean {
    return !!(config.baseUrl && config.token);
  }
} 