import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength, IsEnum } from 'class-validator';
import * as Joi from 'joi';
import { TagType } from './enum';

export class UpdateTagDto {
  @ApiProperty({
    description: 'Tag name',
    example: 'Newsletter',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    description: 'Type of the tag (email or message)',
    enum: TagType,
    example: TagType.EMAIL,
    required: false,
  })
  @IsEnum(TagType)
  @IsOptional()
  type?: TagType;
}

export const UpdateTagSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().valid('email', 'message').optional(),
  status: Joi.string().optional(),
}); 