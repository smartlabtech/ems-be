import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsArray, 
  IsNotEmpty, 
  IsEmail, 
  IsEnum, 
  IsOptional, 
  IsMongoId,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  IsObject,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EmailContentType {
  HTML = 'html',
  TEXT = 'text',
}

@ValidatorConstraint({ name: 'recipientOrRecipientId', async: false })
export class RecipientOrRecipientIdConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as RecipientEmailDto;
    
    // Check if exactly one is provided
    const hasRecipientId = !!object.recipientId;
    const hasRecipient = !!object.recipient;
    
    // XOR logic - exactly one must be true
    return (hasRecipientId && !hasRecipient) || (!hasRecipientId && hasRecipient);
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as RecipientEmailDto;
    
    if (!object.recipientId && !object.recipient) {
      return 'Either recipientId or recipient email must be provided';
    }
    
    if (object.recipientId && object.recipient) {
      return 'Only one of recipientId or recipient email should be provided, not both';
    }
    
    return 'Invalid recipient configuration';
  }
}

export class EmailAttachmentDto {
  @ApiProperty({
    description: 'Filename for the attachment',
    example: 'document.pdf'
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'Base64 encoded content or URL to the file',
    example: 'base64encodedcontent...'
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'MIME type of the attachment',
    example: 'application/pdf',
    required: false
  })
  @IsString()
  @IsOptional()
  contentType?: string;
}

export class RecipientEmailDto {
  @ApiProperty({
    description: 'Recipient email ID from ME_email collection (for tracked emails)',
    example: '60d21b4667d0d8992e610c85',
    required: false
  })
  @IsMongoId({ message: 'Recipient ID must be a valid MongoDB ID' })
  @IsOptional()
  recipientId?: string;

  @ApiProperty({
    description: 'Direct recipient email address (bypasses database validation and tracking)',
    example: 'external@example.com',
    required: false
  })
  @IsEmail({}, { message: 'Recipient must be a valid email address' })
  @IsOptional()
  recipient?: string;

  @ApiProperty({
    description: 'Personalized email body content for this recipient. Supports template variables like {{firstName}}, {{lastName}}, {{email}}',
    example: '<h1>Welcome {{firstName}}!</h1><p>Thank you for joining us, {{firstName}} {{lastName}}.</p>'
  })
  @IsString()
  @IsNotEmpty({ message: 'Body content is required' })
  @MaxLength(500000, { message: 'Body content cannot exceed 500KB' })
  body: string;

  @ApiProperty({
    description: 'Personalized subject for this recipient (optional). If not provided, uses the main subject from SendBulkEmailDto. Supports template variables like {{firstName}}, {{lastName}}, {{email}}',
    example: 'Welcome {{firstName}}! Your account is ready',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Subject cannot exceed 200 characters' })
  subject?: string;

  @ApiProperty({
    description: 'Template variables to replace in subject and body (e.g., firstName, lastName, etc.)',
    example: { firstName: 'John', lastName: 'Doe', companyName: 'Acme Corp' },
    required: false
  })
  @IsObject()
  @IsOptional()
  templateVars?: Record<string, string>;

  @Validate(RecipientOrRecipientIdConstraint)
  _recipientValidation?: any;
}

export class SendBulkEmailDto {
  @ApiProperty({
    description: 'Array of recipients with their personalized email bodies',
    type: [RecipientEmailDto],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one recipient is required' })
  @ArrayMaxSize(1000, { message: 'Maximum 1000 recipients allowed per request' })
  @ValidateNested({ each: true })
  @Type(() => RecipientEmailDto)
  recipients: RecipientEmailDto[];

  @ApiProperty({
    description: 'Email service provider ID to use for sending',
    example: '60d21b4667d0d8992e610c85'
  })
  @IsMongoId({ message: 'Invalid provider ID format' })
  @IsNotEmpty({ message: 'Provider ID is required' })
  providerId: string;

  @ApiProperty({
    description: 'Sender email address (must be configured in the provider)',
    example: 'noreply@company.com'
  })
  @IsEmail({}, { message: 'Sender must be a valid email address' })
  @IsNotEmpty({ message: 'Sender email is required' })
  senderEmail: string;

  @ApiProperty({
    description: 'Default email subject line (used when recipient does not have a personalized subject). Supports template variables like {{firstName}}, {{lastName}}, {{email}}',
    example: 'Welcome to Our Service - {{firstName}}'
  })
  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  @MaxLength(200, { message: 'Subject cannot exceed 200 characters' })
  subject: string;

  @ApiProperty({
    description: 'Type of email content',
    enum: EmailContentType,
    example: EmailContentType.HTML
  })
  @IsEnum(EmailContentType, { message: 'Content type must be either html or text' })
  contentType: EmailContentType;

  @ApiProperty({
    description: 'CC recipients',
    example: ['cc@example.com'],
    required: false,
    isArray: true
  })
  @IsArray()
  @IsOptional()
  @IsEmail({}, { each: true, message: 'Each CC recipient must be a valid email address' })
  @ArrayMaxSize(50, { message: 'Maximum 50 CC recipients allowed' })
  cc?: string[];

  @ApiProperty({
    description: 'BCC recipients',
    example: ['bcc@example.com'],
    required: false,
    isArray: true
  })
  @IsArray()
  @IsOptional()
  @IsEmail({}, { each: true, message: 'Each BCC recipient must be a valid email address' })
  @ArrayMaxSize(50, { message: 'Maximum 50 BCC recipients allowed' })
  bcc?: string[];

  @ApiProperty({
    description: 'Reply-to email address',
    example: 'support@company.com',
    required: false
  })
  @IsEmail({}, { message: 'Reply-to must be a valid email address' })
  @IsOptional()
  replyTo?: string;

  @ApiProperty({
    description: 'Email attachments',
    type: [EmailAttachmentDto],
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  @ArrayMaxSize(10, { message: 'Maximum 10 attachments allowed' })
  attachments?: EmailAttachmentDto[];

  @ApiProperty({
    description: 'Custom headers for the email',
    example: { 'X-Campaign-ID': '12345' },
    required: false
  })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({
    description: 'Whether to process emails in batches',
    required: false,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  batchProcess?: boolean = true;

  @ApiProperty({
    description: 'Size of each batch',
    required: false,
    default: 100
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  batchSize?: number = 100;

  @ApiProperty({
    description: 'Message ID this email is replying to',
    required: false
  })
  @IsString()
  @IsOptional()
  in_reply_to?: string;

  @ApiProperty({
    description: 'Array of message IDs this email references',
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  references?: string[];
}

export interface EmailSendResult {
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
  recordId: string;
  mode?: 'database' | 'direct';  // Indicates whether email was tracked or sent directly
}

export interface BulkEmailResponse {
  success: boolean;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  results: EmailSendResult[];
  batchInfo?: {
    totalBatches: number;
    processedBatches: number;
    batchSize: number;
  };
  processingTime: number;
} 