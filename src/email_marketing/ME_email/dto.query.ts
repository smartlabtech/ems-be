import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import * as Joi from 'joi';
import { EmailSource } from './enum';

export class QueryEmailDto {
  @ApiProperty({
    description: 'Filter by email address (partial match)',
    required: false,
    example: 'user@example.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Filter by mobile number',
    required: false,
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({
    description: 'Filter by WhatsApp number',
    required: false,
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiProperty({
    description: 'Filter by source (In for incoming, Out for outgoing)',
    required: false,
    enum: EmailSource,
    example: EmailSource.IN,
  })
  @IsEnum(EmailSource)
  @IsOptional()
  source?: EmailSource;

  @ApiProperty({
    description: 'General search term (searches across email, firstName, lastName, mobile)',
    required: false,
    example: 'john',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by tag IDs (comma-separated)',
    required: false,
    example: '6837368dab0ec6e85222aba5,6837368dab0ec6e85222aba6',
  })
  @IsString()
  @IsOptional()
  tagIds?: string;

  @ApiProperty({
    description: 'Page number',
    type: Number,
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({
    description: 'Page size',
    type: Number,
    required: false,
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiProperty({
    description: 'Export mode - when true, returns all data without pagination',
    type: Boolean,
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  export?: boolean;

  @ApiProperty({
    description: 'Export batch offset - for exporting large datasets in batches (works with export=true)',
    type: Number,
    required: false,
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  exportOffset?: number;

  @ApiProperty({
    description: 'Export batch limit - maximum records per export batch (default: 10000, max: 10000)',
    type: Number,
    required: false,
    example: 10000,
  })
  @IsOptional()
  @IsNumber()
  exportLimit?: number;
} 




export const QueryEmailSchema = Joi.object({
  search: Joi.string().optional(),
  email: Joi.string().optional(),
  mobile: Joi.string().optional(),
  whatsapp: Joi.string().optional(),
  source: Joi.string().valid('In', 'Out').optional(),
  tagIds: Joi.string().optional(),
  page: Joi.number().optional(),
  size: Joi.number().optional(),
  export: Joi.boolean().optional(),
  exportOffset: Joi.number().min(0).optional(),
  exportLimit: Joi.number().min(1).max(10000).optional(),
});