// File: src/email_marketing/email_service_provider/providers/mailgun/mailgun-provider.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { BaseEmailProviderService } from '../base/base-provider.service';
import { 
  IEmailProviderConfig, 
  IEmailProviderTestResult, 
  IEmailProviderResponse,
  IEmailSendOptions 
} from '../base/base-provider.interface';

@Injectable()
export class MailgunProviderService extends BaseEmailProviderService {
  
  async testConfiguration(config: IEmailProviderConfig): Promise<IEmailProviderTestResult> {
    try {
      console.log('Testing Mailgun configuration...');
      
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Invalid configuration',
          error: 'Missing required fields: apiKey and domain'
        };
      }
      
      // Use the appropriate base URL
      const baseUrl = config.baseUrl || 'https://api.mailgun.net/v3';
      
      // Test by getting domain information
      const response = await axios.get(
        `${baseUrl}/domains/${config.domain}`,
        {
          auth: {
            username: 'api',
            password: config.apiKey!
          },
          timeout: 10000,
        }
      );
      
      if (response.status === 200) {
        const domainInfo = response.data?.domain;
        return {
          success: true,
          message: `Successfully connected to Mailgun domain: ${domainInfo?.name || config.domain}`,
          details: {
            domain: domainInfo?.name,
            state: domainInfo?.state,
            type: domainInfo?.type,
            created_at: domainInfo?.created_at
          }
        };
      }
      
      return {
        success: false,
        message: 'Failed to connect to Mailgun',
        error: `Unexpected status code: ${response.status}`
      };
    } catch (error: any) {
      console.error('Mailgun configuration test error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication failed',
          error: 'Invalid API key'
        };
      }
      
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Domain not found',
          error: `Domain ${config.domain} not found in your Mailgun account`
        };
      }
      
      return this.formatTestErrorResponse(error);
    }
  }
  
  async sendEmail(config: IEmailProviderConfig, options: IEmailSendOptions): Promise<IEmailProviderResponse> {
    try {
      console.log('Sending email via Mailgun...');
      
      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: 'Invalid configuration: Missing required fields'
        };
      }
      
      // Validate email addresses
      const toAddresses = this.normalizeEmailAddresses(options.to);
      if (toAddresses.length === 0) {
        return {
          success: false,
          error: 'No valid recipient email addresses'
        };
      }
      
      // Use FormData for Mailgun API
      const form = new FormData();
      form.append('from', options.from);
      form.append('to', toAddresses.join(','));
      form.append('subject', options.subject);
      
      if (options.text) {
        form.append('text', options.text);
      }
      
      if (options.html) {
        form.append('html', options.html);
      }
      
      if (options.cc) {
        const ccAddresses = this.normalizeEmailAddresses(options.cc);
        if (ccAddresses.length > 0) {
          form.append('cc', ccAddresses.join(','));
        }
      }
      
      if (options.bcc) {
        const bccAddresses = this.normalizeEmailAddresses(options.bcc);
        if (bccAddresses.length > 0) {
          form.append('bcc', bccAddresses.join(','));
        }
      }
      
      if (options.replyTo) {
        form.append('h:Reply-To', options.replyTo);
      }
      
      // Add email threading headers
      if (options.in_reply_to) {
        form.append('h:In-Reply-To', options.in_reply_to);
      }
      
      if (options.references && options.references.length > 0) {
        form.append('h:References', options.references.join(' '));
      }
      
      // Add custom headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          form.append(`h:${key}`, value);
        });
      }
      
      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        options.attachments.forEach((attachment) => {
          form.append('attachment', attachment.content, {
            filename: attachment.filename,
            contentType: attachment.contentType || 'application/octet-stream'
          });
        });
      }
      
      const baseUrl = config.baseUrl || 'https://api.mailgun.net/v3';
      
      const response = await axios.post(
        `${baseUrl}/${config.domain}/messages`,
        form,
        {
          auth: {
            username: 'api',
            password: config.apiKey!
          },
          headers: form.getHeaders(),
          timeout: 30000,
        }
      );
      
      if (response.status === 200 && response.data) {
        return {
          success: true,
          messageId: response.data.id,
          details: {
            message: response.data.message,
            id: response.data.id
          }
        };
      }
      
      return {
        success: false,
        error: `Unexpected status code: ${response.status}`
      };
    } catch (error: any) {
      console.error('Mailgun send email error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Authentication failed: Invalid API key'
        };
      }
      
      if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.message || 'Bad request: Invalid email data',
          details: error.response.data
        };
      }
      
      if (error.response?.status === 413) {
        return {
          success: false,
          error: 'Payload too large: Email size exceeds Mailgun limits'
        };
      }
      
      return this.formatErrorResponse(error);
    }
  }
  
  validateConfig(config: IEmailProviderConfig): boolean {
    return !!(config.apiKey && config.domain);
  }
} 