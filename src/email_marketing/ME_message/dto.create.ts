import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsEmail, 
  IsArray, 
  IsOptional,
  IsEnum,
  IsObject,
  MaxLength,
  ValidateIf,
  IsDateString
} from 'class-validator';
import { MessageContentType } from './schema';

export class CreateMEMessageDto {
  @ApiProperty({
    description: 'Unique message identifier',
    example: 'user@example.com-1234567890-sender@example.com'
  })
  @IsString()
  @IsNotEmpty()
  message_id: string;

  @ApiProperty({
    description: 'Sender email address',
    example: 'sender@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({
    description: 'Subject of the message',
    example: 'Welcome to our service'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subject: string;

  @ApiProperty({
    description: 'Message content',
    example: '<h1>Welcome!</h1><p>Thank you for joining.</p>'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Content type of the message',
    enum: MessageContentType,
    default: MessageContentType.HTML
  })
  @IsEnum(MessageContentType)
  @IsOptional()
  contentType?: MessageContentType = MessageContentType.HTML;

  @ApiProperty({
    description: 'Comma-separated recipient email addresses',
    example: 'recipient1@example.com,recipient2@example.com'
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Comma-separated CC email addresses',
    example: 'cc1@example.com,cc2@example.com',
    required: false
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== "" && value !== null)
  @IsString()
  cc?: string;

  @ApiProperty({
    description: 'Comma-separated BCC email addresses',
    example: 'bcc1@example.com,bcc2@example.com',
    required: false
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== "" && value !== null)
  @IsString()
  bcc?: string;

  @ApiProperty({
    description: 'Message ID of the message being replied to',
    required: false
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== "" && value !== null)
  @IsString()
  in_reply_to?: string;

  @ApiProperty({
    description: 'Array of message IDs this message references',
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  references?: string[] = [];

  @ApiProperty({
    description: 'Email service provider ID used to send'
  })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({
    description: 'Whether the message was sent or received',
    example: 'sent'
  })
  @IsString()
  @IsNotEmpty()
  sent_or_received: string;

  @ApiProperty({
    description: 'Delivery status of the message',
    example: 'delivered',
    required: false
  })
  @IsString()
  @IsOptional()
  delivery_status?: string;

  @ApiProperty({
    description: 'Custom headers for the message',
    required: false
  })
  @IsObject()
  @IsOptional()
  headers?: Record<string, any>;

  @ApiProperty({
    description: 'Additional metadata',
    required: false
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Tag names - can be comma-separated string or array of strings',
    example: 'Important,Follow-up,Customer Support',
    required: false
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== "" && value !== null && value !== undefined)
  tags?: string | string[];

  @ApiProperty({
    description: 'Timestamp when the message was sent or received',
    example: '2023-01-01T00:00:00.000Z',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: string;
} 