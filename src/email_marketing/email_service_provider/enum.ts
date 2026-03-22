// File: src/email_marketing/email_service_provider/enum.ts

export enum EmailServiceProviderType {
  ERPNEXT = 'ERPNext',
  SENDGRID = 'SendGrid',
  MAILGUN = 'Mailgun',
  SMTP = 'SMTP',
  AMAZON_SES = 'Amazon SES',
  MAILCHIMP = 'Mailchimp',
  POSTMARK = 'Postmark',
}

export enum EmailServiceProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum EmailServiceProviderSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  TYPE = 'type',
  STATUS = 'status',
  DEFAULT = 'default',
}

export enum SortTypeEnum {
  ASCENDING = 'asc',
  DESCENDING = 'desc',
} 