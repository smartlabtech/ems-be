// File: src/email_marketing/email_service_provider/providers/base/base-provider.service.ts

import { Injectable } from '@nestjs/common';
import { 
  IBaseEmailProvider, 
  IEmailProviderConfig, 
  IEmailProviderTestResult, 
  IEmailProviderResponse,
  IEmailSendOptions 
} from './base-provider.interface';

@Injectable()
export abstract class BaseEmailProviderService implements IBaseEmailProvider {
  
  abstract testConfiguration(config: IEmailProviderConfig): Promise<IEmailProviderTestResult>;
  
  abstract sendEmail(config: IEmailProviderConfig, options: IEmailSendOptions): Promise<IEmailProviderResponse>;
  
  abstract validateConfig(config: IEmailProviderConfig): boolean;
  
  /**
   * Optional method to fetch email accounts - only implemented by providers that support it
   */
  async fetchEmailAccounts?(config: IEmailProviderConfig): Promise<any[]> {
    throw new Error('fetchEmailAccounts not implemented for this provider');
  }
  
  /**
   * Helper method to normalize email addresses
   */
  protected normalizeEmailAddresses(emails: string | string[]): string[] {
    if (Array.isArray(emails)) {
      return emails.filter(email => email && email.trim());
    }
    return emails ? [emails.trim()] : [];
  }
  
  /**
   * Helper method to validate email format
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Helper method to format error response
   */
  protected formatErrorResponse(error: any): IEmailProviderResponse {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error.response?.data || error
    };
  }
  
  /**
   * Helper method to format test error response
   */
  protected formatTestErrorResponse(error: any): IEmailProviderTestResult {
    return {
      success: false,
      message: 'Configuration test failed',
      error: error.message || 'Unknown error occurred',
      details: error.response?.data || error
    };
  }
} 