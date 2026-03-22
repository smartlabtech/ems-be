import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsMongoId, IsNumber, IsString, IsEnum } from 'class-validator';
import * as Joi from 'joi';
import { TaggedEntityType } from './enum';

export class QueryTaggedByDto {
  @ApiProperty({
    description: 'Filter by entity type',
    enum: TaggedEntityType,
    required: false,
    example: TaggedEntityType.EMAIL,
  })
  @IsEnum(TaggedEntityType)
  @IsOptional()
  entityType?: TaggedEntityType;

  @ApiProperty({
    description: 'Filter by entity ID',
    required: false,
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  @IsOptional()
  entityId?: string;

  @ApiProperty({
    description: 'Filter by tag ID',
    required: false,
    example: '60d21b4667d0d8992e610c99',
  })
  @IsMongoId()
  @IsOptional()
  tagId?: string;

  @ApiProperty({
    description: 'General search term (searches across related entity and tag data)',
    required: false,
    example: 'john',
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

export const QueryTaggedBySchema = Joi.object({
  search: Joi.string().optional(),
  entityType: Joi.string().valid('email', 'message').optional(),
  entityId: Joi.string().optional(),
  tagId: Joi.string().optional(),
  page: Joi.number().optional(),
  size: Joi.number().optional(),
}); 