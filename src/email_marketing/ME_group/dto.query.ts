import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import * as Joi from 'joi';

export class QueryGroupDto {
  @ApiProperty({
    description: 'Filter by group name (partial match)',
    required: false,
    example: 'Marketing',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filter by a single tag ID',
    type: String,
    required: false,
    example: '60d21b4667d0d8992e610c85',
  })
  @IsOptional()
  @IsString()
  tagId?: string;

  @ApiProperty({
    description: 'Filter by multiple tag IDs (comma-separated)',
    type: String,
    required: false,
    example: '60d21b4667d0d8992e610c85,60d21b4667d0d8992e610c86',
  })
  @IsOptional()
  @IsString()
  tags?: string;

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
    description: 'General search term (searches across name and description)',
    required: false,
    example: 'marketing',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

export const QueryGroupSchema = Joi.object({
  search: Joi.string().optional(),
  name: Joi.string().optional(),
  tagId: Joi.string().optional(),
  tags: Joi.string().optional(),
  page: Joi.number().optional(),
  size: Joi.number().optional(),
}); 