// File: src/email_marketing/email_service_provider/interface.ts
import { EmailServiceProviderType, EmailServiceProviderStatus } from './enum';

export interface IEmailAccount {
  sender: string;
  meta?: any;
}

export interface IEmailServiceProvider {
  _id: string;
  name: string;
  status: EmailServiceProviderStatus;
  creator: string;
  default: boolean;
  type: EmailServiceProviderType;
  baseUrl: string;
  token: string;
  emailAccounts: IEmailAccount[];
  createdAt: Date;
  updatedAt: Date;
  thirdPartyError?: {
    message: string;
    timestamp: Date;
    details?: any;
  };
}

export interface IEmailTestResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface IEmailServiceProviderResponse {
  data: IEmailServiceProvider[];
  total: number;
  page: number;
  size: number;
} 