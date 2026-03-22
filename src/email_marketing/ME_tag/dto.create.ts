import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength, IsEnum } from 'class-validator';
import * as Joi from 'joi';
import { TagType } from './enum';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name',
    example: 'Newsletter',
    minLength: 2,
    maxLength: 50,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Type of the tag (email or message)',
    enum: TagType,
    example: TagType.EMAIL,
    required: true,
  })
  @IsEnum(TagType)
  @IsNotEmpty()
  type: TagType;
}

export const CreateTagSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('email', 'message').required(),
  status: Joi.string().optional(),
}); 