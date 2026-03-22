import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import * as Joi from 'joi';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'Marketing Team',
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
    description: 'Group description',
    example: 'This group is for the marketing team and related activities.',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Array of tag IDs related to this group',
    example: ['60d21b4667d0d8992e610c85', '60d21b4667d0d8992e610c86'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export const CreateGroupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().allow('', null).max(500).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
}); 