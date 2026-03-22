import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsEnum } from 'class-validator';
import * as Joi from 'joi';
import { TaggedEntityType } from './enum';

export class UpdateTaggedByDto {
  @ApiProperty({
    description: 'Type of entity being tagged (cannot be changed after creation)',
    enum: TaggedEntityType,
    example: TaggedEntityType.EMAIL,
    required: false,
  })
  @IsEnum(TaggedEntityType)
  @IsOptional()
  entityType?: TaggedEntityType;

  @ApiProperty({
    description: 'ID of the entity being tagged',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  entityId?: string;

  @ApiProperty({
    description: 'Reference to the tag document',
    example: '60d21b4667d0d8992e610c99',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  tagId?: string;
}

export const UpdateTaggedBySchema = Joi.object({
  entityType: Joi.string().valid('email', 'message').optional(),
  entityId: Joi.string().optional(),
  tagId: Joi.string().optional(),
  status: Joi.string().optional(),
}); 