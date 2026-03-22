import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import * as Joi from 'joi';
import { TagType } from './enum';

export class QueryTagDto {
  @ApiProperty({
    description: 'Filter by tag name (partial match)',
    required: false,
    example: 'Newsletter',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filter by tag type',
    enum: TagType,
    required: false,
    example: TagType.EMAIL,
  })
  @IsEnum(TagType)
  @IsOptional()
  type?: TagType;

  @ApiProperty({
    description: 'General search term (searches across name)',
    required: false,
    example: 'newsletter',
  })
  @IsString()
  @IsOptional()
  search?: string;

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
}

export const QueryTagSchema = Joi.object({
  search: Joi.string().optional(),
  name: Joi.string().optional(),
  type: Joi.string().valid('email', 'message').optional(),
  page: Joi.number().optional(),
  size: Joi.number().optional(),
}); 