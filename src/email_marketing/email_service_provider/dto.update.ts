import { ApiProperty } from '@nestjs/swagger';
import * as Joi from 'joi';
import { EmailServiceProviderType, EmailServiceProviderStatus } from './enum';

export class UpdateEmailAccountDto {
  @ApiProperty({
    description: 'Sender email address',
    example: 'support@email.com',
    required: false,
  })
  sender?: string;

  @ApiProperty({
    description: 'Additional metadata for the email account',
    type: 'object',
    required: false,
  })
  meta?: any;
}

export class UpdateEmailServiceProviderDto {
  @ApiProperty({
    description: 'Name of the email service provider',
    example: 'ERPNext For Marketing',
    required: false,
  })
  name?: string;

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
    required: false,
  })
  type?: EmailServiceProviderType;

  @ApiProperty({
    description: 'Base URL for the email service',
    example: 'https://erpnext-marketing.sys-track-overview.site',
    required: false,
  })
  baseUrl?: string;

  @ApiProperty({
    description: 'Authentication token for the email service',
    example: 'de668493e4344b0:38d508b26d63eba',
    required: false,
  })
  token?: string;

  @ApiProperty({
    description: 'Array of email accounts for this provider',
    type: [UpdateEmailAccountDto],
    required: false,
  })
  emailAccounts?: UpdateEmailAccountDto[];
}

// Joi validation schemas
export const UpdateEmailAccountSchema = Joi.object({
  sender: Joi.string().email().messages({
    'string.email': 'Sender must be a valid email address',
  }),
  meta: Joi.object().optional(),
});

export const UpdateEmailServiceProviderSchema = Joi.object({
  name: Joi.string().min(1).messages({
    'string.min': 'Name cannot be empty',
  }),
  status: Joi.string()
    .valid(...Object.values(EmailServiceProviderStatus))
    .messages({
      'any.only': `Status must be one of: ${Object.values(EmailServiceProviderStatus).join(', ')}`,
    }),
  default: Joi.boolean(),
  type: Joi.string()
    .valid(...Object.values(EmailServiceProviderType))
    .messages({
      'any.only': `Type must be one of: ${Object.values(EmailServiceProviderType).join(', ')}`,
    }),
  baseUrl: Joi.string().uri().messages({
    'string.uri': 'Base URL must be a valid URI',
  }),
  token: Joi.string().min(1).messages({
    'string.min': 'Token cannot be empty',
  }),
  emailAccounts: Joi.array().items(UpdateEmailAccountSchema),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
}); 