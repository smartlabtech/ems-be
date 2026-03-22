// File: src/email_marketing/email_service_provider/providers/sendgrid/sendgrid-provider.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { BaseEmailProviderService } from '../base/base-provider.service';
import { 
  IEmailProviderConfig, 
  IEmailProviderTestResult, 
  IEmailProviderResponse,
  IEmailSendOptions 
} from '../base/base-provider.interface';

@Injectable()
export class SendGridProviderService extends BaseEmailProviderService {
  
  private readonly SENDGRID_API_URL = 'https://api.sendgrid.com/v3';
  
  async testConfiguration(config: IEmailProviderConfig): Promise<IEmailProviderTestResult> {
    try {
      console.log('Testing SendGrid configuration...');
      
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Invalid configuration',
          error: 'Missing required field: apiKey'
        };
      }
      
      // Test API key by checking account details
      const response = await axios.get(`${this.SENDGRID_API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      if (response.status === 200) {
        const profile = response.data;
        return {
          success: true,
          message: `Successfully connected to SendGrid account: ${profile.email || 'Unknown'}`,
          details: { 
            email: profile.email,
            username: profile.username,
            account_id: profile.account_id
          }
        };
      }
      
      return {
        success: false,
        message: 'Failed to connect to SendGrid',
        error: `Unexpected status code: ${response.status}`
      };
    } catch (error: any) {
      console.error('SendGrid configuration test error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication failed',
          error: 'Invalid API key'
        };
      }
      
      if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Access denied',
          error: 'API key does not have required permissions'
        };
      }
      
      return this.formatTestErrorResponse(error);
    }
  }
  
  async sendEmail(config: IEmailProviderConfig, options: IEmailSendOptions): Promise<IEmailProviderResponse> {
    try {
      console.log('Sending email via SendGrid...');
      
      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: 'Invalid configuration: Missing API key'
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
      
      // Build personalizations
      const personalizations = [{
        to: toAddresses.map(email => ({ email })),
        ...(options.cc && { cc: this.normalizeEmailAddresses(options.cc).map(email => ({ email })) }),
        ...(options.bcc && { bcc: this.normalizeEmailAddresses(options.bcc).map(email => ({ email })) }),
      }];
      
      // Build email payload
      const payload: any = {
        personalizations,
        from: { email: options.from },
        subject: options.subject,
        content: []
      };
      
      if (options.text) {
        payload.content.push({ type: 'text/plain', value: options.text });
      }
      
      if (options.html) {
        payload.content.push({ type: 'text/html', value: options.html });
      }
      
      if (payload.content.length === 0) {
        payload.content.push({ type: 'text/plain', value: ' ' }); // SendGrid requires at least one content
      }
      
      if (options.replyTo) {
        payload.reply_to = { email: options.replyTo };
      }
      
      if (options.attachments && options.attachments.length > 0) {
        payload.attachments = options.attachments.map(att => ({
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
          filename: att.filename,
          type: att.contentType || 'application/octet-stream',
          disposition: 'attachment'
        }));
      }
      
      // Handle custom headers including email threading
      const headers: Record<string, string> = {};
      
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      
      if (options.in_reply_to) {
        headers['In-Reply-To'] = options.in_reply_to;
      }
      
      if (options.references && options.references.length > 0) {
        headers['References'] = options.references.join(' ');
      }
      
      if (Object.keys(headers).length > 0) {
        payload.headers = headers;
      }
      
      const response = await axios.post(
        `${this.SENDGRID_API_URL}/mail/send`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      // SendGrid returns 202 for successful email queuing
      if (response.status === 202) {
        return {
          success: true,
          messageId: response.headers['x-message-id'] || 'queued',
          details: { status: 'Accepted', message: 'Email queued for delivery' }
        };
      }
      
      return {
        success: false,
        error: `Unexpected status code: ${response.status}`
      };
    } catch (error: any) {
      console.error('SendGrid send email error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Authentication failed: Invalid API key'
        };
      }
      
      if (error.response?.status === 413) {
        return {
          success: false,
          error: 'Payload too large: Email size exceeds SendGrid limits'
        };
      }
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors.map((e: any) => e.message).join(', ');
        return {
          success: false,
          error: errors,
          details: error.response.data
        };
      }
      
      return this.formatErrorResponse(error);
    }
  }
  
  validateConfig(config: IEmailProviderConfig): boolean {
    return !!config.apiKey;
  }
} 