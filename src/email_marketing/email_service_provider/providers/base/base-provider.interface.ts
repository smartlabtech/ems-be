// File: src/email_marketing/email_service_provider/providers/base/base-provider.interface.ts

export interface IEmailProviderConfig {
  name: string;
  baseUrl?: string;
  token?: string;
  apiKey?: string;
  apiSecret?: string;
  domain?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
  emailAccounts?: any[];
}

export interface IEmailSendOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  headers?: Record<string, string>;
  in_reply_to?: string;
  references?: string[];
}

export interface IEmailProviderTestResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
}

export interface IEmailProviderResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface IBaseEmailProvider {
  testConfiguration(config: IEmailProviderConfig): Promise<IEmailProviderTestResult>;
  sendEmail(config: IEmailProviderConfig, options: IEmailSendOptions): Promise<IEmailProviderResponse>;
  fetchEmailAccounts?(config: IEmailProviderConfig): Promise<any[]>;
  validateConfig(config: IEmailProviderConfig): boolean;
} 