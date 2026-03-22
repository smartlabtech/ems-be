import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsOptional, 
  IsArray,
  IsBoolean,
  MaxLength 
} from 'class-validator';
import { TemplateContentType } from './schema';

export class CreateMETemplateDto {
  @ApiProperty({
    description: 'Template name for identification',
    example: 'Welcome Email Template'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Email subject line template',
    example: 'Welcome to {{companyName}}!'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    description: 'Email content template with variables',
    example: '<h1>Hello {{firstName}}!</h1><p>Welcome to our service.</p>'
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Type of content',
    enum: TemplateContentType,
    default: TemplateContentType.HTML,
    required: false
  })
  @IsEnum(TemplateContentType)
  @IsOptional()
  contentType?: TemplateContentType = TemplateContentType.HTML;

  @ApiProperty({
    description: 'Whether the template is active',
    default: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Tags for categorizing templates',
    example: ['welcome', 'onboarding'],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @ApiProperty({
    description: 'Description of the template purpose',
    example: 'Used for welcoming new users',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
} 