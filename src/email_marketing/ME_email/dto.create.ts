import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, ValidateIf } from 'class-validator';
import * as Joi from 'joi';

export class CreateEmailDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Mobile number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({
    description: 'WhatsApp number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiProperty({
    description: 'Tag names - can be comma-separated string or array of strings',
    example: 'Newsletter,VIP,Customer Support',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== "" && value !== null && value !== undefined)
  tags?: string | string[];
}

export const CreateEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().allow('', null).optional(),
  lastName: Joi.string().allow('', null).optional(),
  mobile: Joi.string().allow('', null).optional(),
  whatsapp: Joi.string().allow('', null).optional(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  status: Joi.string().optional(),
}); 