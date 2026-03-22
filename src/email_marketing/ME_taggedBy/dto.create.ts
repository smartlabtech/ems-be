import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsEnum } from 'class-validator';
import * as Joi from 'joi';
import { TaggedEntityType } from './enum';

export class CreateTaggedByDto {
  @ApiProperty({
    description: 'Type of entity being tagged',
    enum: TaggedEntityType,
    example: TaggedEntityType.EMAIL,
    required: true,
  })
  @IsEnum(TaggedEntityType)
  @IsNotEmpty()
  entityType: TaggedEntityType;

  @ApiProperty({
    description: 'ID of the entity being tagged (email, message, etc.)',
    example: '60d21b4667d0d8992e610c85',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'Reference to the tag document',
    example: '60d21b4667d0d8992e610c99',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  tagId: string;
}

export const CreateTaggedBySchema = Joi.object({
  entityType: Joi.string().valid('email', 'message').required(),
  entityId: Joi.string().required(),
  tagId: Joi.string().required(),
  status: Joi.string().optional(),
}); 