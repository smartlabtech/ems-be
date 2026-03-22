import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../schema';

export type MEMessageDocument = ME_message & Document;

export enum MessageContentType {
  HTML = 'html',
  TEXT = 'text',
}

@Schema({ 
  timestamps: true,
  versionKey: false,
  collection: 'me_message',
})
export class ME_message {
  @ApiProperty({
    description: 'ID of the user who created the message',
    example: '60d21b4667d0d8992e610c85'
  })
  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  creator: mongoose.Schema.Types.ObjectId;

  @ApiProperty({
    description: 'Sender email address',
    example: 'sender@example.com'
  })
  @Prop({ required: true })
  sender: string;

  @ApiProperty({
    description: 'Unique message identifier',
    example: 'user123-1234567890-sender@example.com'
  })
  @Prop({ required: true })
  message_id: string;

  @ApiProperty({
    description: 'Message ID this is a reply to',
    example: 'previous-message-id'
  })
  @Prop()
  in_reply_to?: string;

  @ApiProperty({
    description: 'Thread references',
    example: ['thread-id-1', 'thread-id-2']
  })
  @Prop({ type: [String], default: [] })
  references: string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to our service!'
  })
  @Prop({ required: true })
  subject: string;

  @ApiProperty({
    description: 'Email message content',
    example: '<html><body>Hello!</body></html>'
  })
  @Prop({ required: true })
  message: string;

  @ApiProperty({
    description: 'Content type',
    enum: MessageContentType,
    default: MessageContentType.HTML
  })
  @Prop({ 
    type: String, 
    enum: MessageContentType, 
    default: MessageContentType.HTML 
  })
  contentType: MessageContentType;

  @ApiProperty({
    description: 'To recipients',
    example: ['recipient1@example.com', 'recipient2@example.com']
  })
  @Prop({ type: [String], default: [] })
  to: string[];

  @ApiProperty({
    description: 'CC recipients',
    example: ['cc@example.com']
  })
  @Prop({ type: [String], default: [] })
  cc: string[];

  @ApiProperty({
    description: 'BCC recipients',
    example: ['bcc@example.com']
  })
  @Prop({ type: [String], default: [] })
  bcc: string[];

  @ApiProperty({
    description: 'Parent message ID for threading',
    example: '60d21b4667d0d8992e610c85'
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ME_message' })
  belongToMessageId?: mongoose.Schema.Types.ObjectId;

  @ApiProperty({
    description: 'Whether the message was sent or received',
    example: 'sent'
  })
  @Prop({ 
    type: String, 
    required: true 
  })
  sent_or_received: string;

  @ApiProperty({
    description: 'Delivery status of the message',
    example: 'delivered'
  })
  @Prop({ 
    type: String 
  })
  delivery_status?: string;

  @ApiProperty({
    description: 'Timestamp when the message was sent or received',
    example: '2023-01-01T00:00:00.000Z'
  })
  @Prop()
  timestamp?: Date;

  @ApiProperty({
    description: 'Read timestamp',
    example: '2023-01-01T00:00:00.000Z'
  })
  @Prop()
  readAt?: Date;

  @ApiProperty({
    description: 'Is message read',
    default: false
  })
  @Prop({ default: false })
  isRead: boolean;

  @ApiProperty({
    description: 'Email provider ID',
    example: 'sendgrid'
  })
  @Prop({ required: true })
  providerId: string;

  @ApiProperty({
    description: 'Provider-specific message ID',
    example: 'provider-message-123'
  })
  @Prop()
  providerMessageId?: string;

  @ApiProperty({
    description: 'Email headers',
    example: { 'X-Mailer': 'NodeMailer' }
  })
  @Prop({ type: Object })
  headers?: Record<string, any>;

  @ApiProperty({
    description: 'Attachments',
    example: [{ filename: 'doc.pdf', contentType: 'application/pdf', size: 1024 }]
  })
  @Prop({ type: [Object], default: [] })
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    url?: string;
  }>;

  @ApiProperty({
    description: 'Additional metadata',
    example: { campaign: 'welcome-campaign' }
  })
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Error message if failed',
    example: 'Invalid email address'
  })
  @Prop()
  error?: string;

  @ApiProperty({
    description: 'Number of retry attempts',
    default: 0
  })
  @Prop({ default: 0 })
  retryCount: number;

  @ApiProperty({
    description: 'Last retry timestamp',
    example: '2023-01-01T00:00:00.000Z'
  })
  @Prop()
  lastRetryAt?: Date;

  @ApiProperty({
    description: 'Provider-specific message data',
    example: { erpnext_id: 'COMM-123' }
  })
  @Prop({ type: Object })
  messageData?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Prop()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-02T00:00:00.000Z',
  })
  @Prop()
  updatedAt: Date;
}

export const MEMessageSchema = SchemaFactory.createForClass(ME_message);
MEMessageSchema.index({ message_id: 1, creator: 1 }, { unique: true });
MEMessageSchema.index({ creator: 1, createdAt: -1 });
MEMessageSchema.index({ sender: 1, creator: 1 });
MEMessageSchema.index({ to: 1, creator: 1 });
MEMessageSchema.index({ belongToMessageId: 1 });

// Optimized indexes for aggregation pipeline
MEMessageSchema.index({ creator: 1, timestamp: -1, belongToMessageId: 1 });
MEMessageSchema.index({ creator: 1, createdAt: -1, belongToMessageId: 1 });

// Additional indexes for thread aggregation performance
MEMessageSchema.index({ creator: 1, belongToMessageId: 1, timestamp: -1 });
MEMessageSchema.index({ belongToMessageId: 1, timestamp: -1 });
MEMessageSchema.index({ _id: 1, creator: 1 }); 