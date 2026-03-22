// File: src/email_marketing/email_service_provider/providers/smtp/smtp-provider.service.ts

import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { BaseEmailProviderService } from '../base/base-provider.service';
import { 
  IEmailProviderConfig, 
  IEmailProviderTestResult, 
  IEmailProviderResponse,
  IEmailSendOptions 
} from '../base/base-provider.interface';

@Injectable()
export class SMTPProviderService extends BaseEmailProviderService {
  
  private createTransporter(config: IEmailProviderConfig): Transporter {
    return createTransport({
      host: config.host,
      port: config.port || 587,
      secure: config.secure || false, // true for 465, false for other ports
      auth: {
        user: config.auth?.user,
        pass: config.auth?.pass,
      },
      tls: {
        rejectUnauthorized: false // Accept self-signed certificates
      }
    });
  }
  
  async testConfiguration(config: IEmailProviderConfig): Promise<IEmailProviderTestResult> {
    try {
      console.log('Testing SMTP configuration...');
      
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Invalid configuration',
          error: 'Missing required fields: host, port, auth.user, and auth.pass'
        };
      }
      
      const transporter = this.createTransporter(config);
      
      // Verify SMTP connection
      await transporter.verify();
      
      return {
        success: true,
        message: `Successfully connected to SMTP server at ${config.host}:${config.port}`,
        details: {
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.auth?.user
        }
      };
    } catch (error: any) {
      console.error('SMTP configuration test error:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Connection refused',
          error: `Cannot connect to SMTP server at ${config.host}:${config.port}`
        };
      }
      
      if (error.code === 'EAUTH') {
        return {
          success: false,
          message: 'Authentication failed',
          error: 'Invalid username or password'
        };
      }
      
      if (error.code === 'ETIMEDOUT') {
        return {
          success: false,
          message: 'Connection timeout',
          error: `SMTP server at ${config.host}:${config.port} is not responding`
        };
      }
      
      return this.formatTestErrorResponse(error);
    }
  }
  
  async sendEmail(config: IEmailProviderConfig, options: IEmailSendOptions): Promise<IEmailProviderResponse> {
    try {
      console.log('Sending email via SMTP...');
      
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
      
      const transporter = this.createTransporter(config);
      
      // Build email options
      const mailOptions: any = {
        from: options.from,
        to: toAddresses.join(','),
        subject: options.subject,
      };
      
      if (options.text) {
        mailOptions.text = options.text;
      }
      
      if (options.html) {
        mailOptions.html = options.html;
      }
      
      if (options.cc) {
        const ccAddresses = this.normalizeEmailAddresses(options.cc);
        if (ccAddresses.length > 0) {
          mailOptions.cc = ccAddresses.join(',');
        }
      }
      
      if (options.bcc) {
        const bccAddresses = this.normalizeEmailAddresses(options.bcc);
        if (bccAddresses.length > 0) {
          mailOptions.bcc = bccAddresses.join(',');
        }
      }
      
      if (options.replyTo) {
        mailOptions.replyTo = options.replyTo;
      }
      
      // Add email threading headers
      if (options.in_reply_to) {
        mailOptions.inReplyTo = options.in_reply_to;
      }
      
      if (options.references && options.references.length > 0) {
        mailOptions.references = options.references.join(' ');
      }
      
      if (options.headers) {
        mailOptions.headers = options.headers;
      }
      
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }));
      }
      
      // Send email
      const info = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        details: {
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
          envelope: info.envelope
        }
      };
    } catch (error: any) {
      console.error('SMTP send email error:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: `Cannot connect to SMTP server at ${config.host}:${config.port}`
        };
      }
      
      if (error.code === 'EAUTH') {
        return {
          success: false,
          error: 'SMTP authentication failed'
        };
      }
      
      if (error.responseCode === 550) {
        return {
          success: false,
          error: 'Recipient address rejected by server',
          details: error.response
        };
      }
      
      if (error.code === 'EMESSAGE') {
        return {
          success: false,
          error: 'Invalid message: ' + (error.response || error.message)
        };
      }
      
      return this.formatErrorResponse(error);
    }
  }
  
  validateConfig(config: IEmailProviderConfig): boolean {
    return !!(
      config.host && 
      config.port && 
      config.auth?.user && 
      config.auth?.pass
    );
  }
} 