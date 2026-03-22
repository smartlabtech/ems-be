import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import * as Joi from 'joi';

export class UpdateGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'Marketing Team',
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

export const UpdateGroupSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  description: Joi.string().allow('', null).max(500).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
}); 