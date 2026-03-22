// File: src/email_marketing/email_service_provider/providers/provider-factory.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { EmailServiceProviderType } from '../enum';
import { BaseEmailProviderService } from './base/base-provider.service';
import { ERPNextProviderService } from './erpnext/erpnext-provider.service';
import { SendGridProviderService } from './sendgrid/sendgrid-provider.service';
import { MailgunProviderService } from './mailgun/mailgun-provider.service';
import { SMTPProviderService } from './smtp/smtp-provider.service';

@Injectable()
export class EmailProviderFactory {
  constructor(
    private readonly erpnextProvider: ERPNextProviderService,
    private readonly sendgridProvider: SendGridProviderService,
    private readonly mailgunProvider: MailgunProviderService,
    private readonly smtpProvider: SMTPProviderService,
  ) {}
  
  /**
   * Get the appropriate provider service based on the provider type
   */
  getProvider(type: EmailServiceProviderType): BaseEmailProviderService {
    switch (type) {
      case EmailServiceProviderType.ERPNEXT:
        return this.erpnextProvider;
      
      case EmailServiceProviderType.SENDGRID:
        return this.sendgridProvider;
      
      case EmailServiceProviderType.MAILGUN:
        return this.mailgunProvider;
      
      case EmailServiceProviderType.SMTP:
        return this.smtpProvider;
      
      case EmailServiceProviderType.AMAZON_SES:
      case EmailServiceProviderType.MAILCHIMP:
      case EmailServiceProviderType.POSTMARK:
        // TODO: Implement these providers
        throw new BadRequestException(`Provider ${type} is not yet implemented`);
      
      default:
        throw new BadRequestException(`Unknown email service provider type: ${type}`);
    }
  }
  
  /**
   * Get all available provider types
   */
  getAvailableProviders(): EmailServiceProviderType[] {
    return [
      EmailServiceProviderType.ERPNEXT,
      EmailServiceProviderType.SENDGRID,
      EmailServiceProviderType.MAILGUN,
      EmailServiceProviderType.SMTP,
    ];
  }
  
  /**
   * Check if a provider type is implemented
   */
  isProviderImplemented(type: EmailServiceProviderType): boolean {
    try {
      this.getProvider(type);
      return true;
    } catch {
      return false;
    }
  }
} 