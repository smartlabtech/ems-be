import { ApiProperty } from '@nestjs/swagger';
import * as Joi from 'joi';
import { EmailServiceProviderType, EmailServiceProviderStatus, EmailServiceProviderSortBy, SortTypeEnum } from './enum';

export class QueryEmailServiceProviderDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    required: false,
  })
  size?: number;

  @ApiProperty({
    description: 'Search term for filtering',
    example: 'support@2zpoint.com',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: 'Filter by provider name',
    example: 'ERPNext For Marketing',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Filter by status',
    enum: EmailServiceProviderStatus,
    example: EmailServiceProviderStatus.ACTIVE,
    required: false,
  })
  status?: EmailServiceProviderStatus;

  @ApiProperty({
    description: 'Filter by creator ID',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  creator?: string;

  @ApiProperty({
    description: 'Filter by default flag',
    example: true,
    required: false,
  })
  default?: boolean;

  @ApiProperty({
    description: 'Filter by email service provider type',
    enum: EmailServiceProviderType,
    example: EmailServiceProviderType.ERPNEXT,
    required: false,
  })
  type?: EmailServiceProviderType;

  @ApiProperty({
    description: 'Field to sort by',
    enum: EmailServiceProviderSortBy,
    example: EmailServiceProviderSortBy.CREATED_AT,
    required: false,
  })
  orderBy?: EmailServiceProviderSortBy;

  @ApiProperty({
    description: 'Sort direction',
    enum: SortTypeEnum,
    example: SortTypeEnum.DESCENDING,
    required: false,
  })
  sortType?: SortTypeEnum;

  @ApiProperty({
    description: 'Filter by creation date from',
    example: '2023-01-01T00:00:00.000Z',
    required: false,
  })
  createdFrom?: string;

  @ApiProperty({
    description: 'Filter by creation date to',
    example: '2023-12-31T23:59:59.999Z',
    required: false,
  })
  createdTo?: string;

  @ApiProperty({
    description: 'Filter by update date from',
    example: '2023-01-01T00:00:00.000Z',
    required: false,
  })
  updatedFrom?: string;

  @ApiProperty({
    description: 'Filter by update date to',
    example: '2023-12-31T23:59:59.999Z',
    required: false,
  })
  updatedTo?: string;

  @ApiProperty({
    description: 'Skip third-party API updates for better performance',
    example: false,
    required: false,
  })
  skipThirdPartyUpdates?: boolean;
}

// Joi validation schema
export const QueryEmailServiceProviderSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  size: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Size must be a number',
    'number.integer': 'Size must be an integer',
    'number.min': 'Size must be at least 1',
    'number.max': 'Size cannot exceed 100',
  }),
  search: Joi.string().trim().allow('').messages({
    'string.base': 'Search must be a string',
  }),
  name: Joi.string().trim().messages({
    'string.base': 'Name must be a string',
  }),
  status: Joi.string()
    .valid(...Object.values(EmailServiceProviderStatus))
    .messages({
      'any.only': `Status must be one of: ${Object.values(EmailServiceProviderStatus).join(', ')}`,
    }),
  creator: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Creator must be a valid MongoDB ObjectId',
  }),
  default: Joi.boolean().messages({
    'boolean.base': 'Default must be a boolean value',
  }),
  type: Joi.string()
    .valid(...Object.values(EmailServiceProviderType))
    .messages({
      'any.only': `Type must be one of: ${Object.values(EmailServiceProviderType).join(', ')}`,
    }),
  orderBy: Joi.string()
    .valid(...Object.values(EmailServiceProviderSortBy))
    .default(EmailServiceProviderSortBy.CREATED_AT)
    .messages({
      'any.only': `Order by must be one of: ${Object.values(EmailServiceProviderSortBy).join(', ')}`,
    }),
  sortType: Joi.string()
    .valid(...Object.values(SortTypeEnum))
    .default(SortTypeEnum.DESCENDING)
    .messages({
      'any.only': `Sort type must be one of: ${Object.values(SortTypeEnum).join(', ')}`,
    }),
  createdFrom: Joi.date().iso().messages({
    'date.format': 'Created from must be a valid ISO date',
  }),
  createdTo: Joi.date().iso().messages({
    'date.format': 'Created to must be a valid ISO date',
  }),
  updatedFrom: Joi.date().iso().messages({
    'date.format': 'Updated from must be a valid ISO date',
  }),
  updatedTo: Joi.date().iso().messages({
    'date.format': 'Updated to must be a valid ISO date',
  }),
  skipThirdPartyUpdates: Joi.boolean().messages({
    'boolean.base': 'Skip third party updates must be a boolean value',
  }),
}).custom((value, helpers) => {
  // Validate date ranges
  if (value.createdFrom && value.createdTo && new Date(value.createdFrom) > new Date(value.createdTo)) {
    return helpers.error('custom.createdDateRange');
  }
  if (value.updatedFrom && value.updatedTo && new Date(value.updatedFrom) > new Date(value.updatedTo)) {
    return helpers.error('custom.updatedDateRange');
  }
  return value;
}).messages({
  'custom.createdDateRange': 'Created from date must be before created to date',
  'custom.updatedDateRange': 'Updated from date must be before updated to date',
}); 