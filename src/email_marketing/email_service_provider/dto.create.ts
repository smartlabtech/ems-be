// File: src/email_marketing/email_service_provider/dto.create.ts
import { ApiProperty } from '@nestjs/swagger';
import * as Joi from 'joi';
import { EmailServiceProviderType, EmailServiceProviderStatus } from './enum';

export class CreateEmailAccountDto {
  @ApiProperty({
    description: 'Sender email address',
    example: 'support@email.com',
  })
  sender: string;

  @ApiProperty({
    description: 'Additional metadata for the email account',
    type: 'object',
    required: false,
  })
  meta?: any;
}

export class CreateEmailServiceProviderDto {
  @ApiProperty({
    description: 'Name of the email service provider',
    example: 'ERPNext For Marketing',
  })
  name: string;

  @ApiProperty({
    description: 'Status of the email service provider',
    enum: EmailServiceProviderStatus,
    example: EmailServiceProviderStatus.ACTIVE,
    required: false,
  })
  status?: EmailServiceProviderStatus;

  @ApiProperty({
    description: 'Whether this is the default email service provider',
    example: false,
    required: false,
  })
  default?: boolean;

  @ApiProperty({
    description: 'Type of email service provider',
    enum: EmailServiceProviderType,
    example: EmailServiceProviderType.ERPNEXT,
  })
  type: EmailServiceProviderType;

  @ApiProperty({
    description: 'Base URL for the email service',
    example: 'https://erpnext-marketing.sys-track-overview.site',
  })
  baseUrl: string;

  @ApiProperty({
    description: 'Authentication token for the email service',
    example: 'de668493e4344b0:38d508b26d63eba',
  })
  token: string;

  @ApiProperty({
    description: 'Array of email accounts for this provider',
    type: [CreateEmailAccountDto],
    required: false,
  })
  emailAccounts?: CreateEmailAccountDto[];
}

// Joi validation schemas
export const CreateEmailAccountSchema = Joi.object({
  sender: Joi.string().email().required().messages({
    'string.email': 'Sender must be a valid email address',
    'any.required': 'Sender is required',
  }),
  meta: Joi.object().optional(),
});

export const CreateEmailServiceProviderSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    'string.min': 'Name cannot be empty',
    'any.required': 'Name is required',
  }),
  status: Joi.string()
    .valid(...Object.values(EmailServiceProviderStatus))
    .default(EmailServiceProviderStatus.ACTIVE)
    .messages({
      'any.only': `Status must be one of: ${Object.values(EmailServiceProviderStatus).join(', ')}`,
    }),
  default: Joi.boolean().default(false),
  type: Joi.string()
    .valid(...Object.values(EmailServiceProviderType))
    .required()
    .messages({
      'any.only': `Type must be one of: ${Object.values(EmailServiceProviderType).join(', ')}`,
      'any.required': 'Type is required',
    }),
  baseUrl: Joi.string().uri().required().messages({
    'string.uri': 'Base URL must be a valid URI',
    'any.required': 'Base URL is required',
  }),
  token: Joi.string().min(1).required().messages({
    'string.min': 'Token cannot be empty',
    'any.required': 'Token is required',
  }),
  emailAccounts: Joi.array().items(CreateEmailAccountSchema).default([]),
}); 