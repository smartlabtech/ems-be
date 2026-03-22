// File: src/email_marketing/email_service_provider/schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { EmailServiceProviderType, EmailServiceProviderStatus } from './enum';

export type EmailServiceProviderDocument = EmailServiceProvider & Document;

/**
 * Email Account Schema for storing email account configurations
 */
@Schema({ _id: false })
export class EmailAccount {
  @ApiProperty({
    description: 'Sender email address',
    example: 'support@email.com',
  })
  @Prop({ required: true, trim: true })
  sender: string;

  @ApiProperty({
    description: 'Additional metadata for the email account',
    type: 'object',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  meta?: any;
}

export const EmailAccountSchema = SchemaFactory.createForClass(EmailAccount);

/**
 * Main Email Service Provider Schema
 */
@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'email_service_provider',
})
export class EmailServiceProvider {
  @ApiProperty({
    description: 'Name of the email service provider',
    example: 'ERPNext For Marketing',
  })
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @ApiProperty({
    description: 'Status of the email service provider',
    enum: EmailServiceProviderStatus,
    example: EmailServiceProviderStatus.ACTIVE,
  })
  @Prop({ 
    type: String, 
    enum: EmailServiceProviderStatus, 
    default: EmailServiceProviderStatus.ACTIVE,
    index: true
  })
  status: EmailServiceProviderStatus;

  @ApiProperty({
    description: 'User ID of the creator',
    example: '60d21b4667d0d8992e610c85',
  })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  creator: mongoose.Schema.Types.ObjectId;

  @ApiProperty({
    description: 'Whether this is the default email service provider',
    example: false,
  })
  @Prop({ default: false, index: true })
  default: boolean;

  @ApiProperty({
    description: 'Type of email service provider',
    enum: EmailServiceProviderType,
    example: EmailServiceProviderType.ERPNEXT,
  })
  @Prop({ 
    type: String, 
    enum: EmailServiceProviderType, 
    required: true,
    index: true
  })
  type: EmailServiceProviderType;

  @ApiProperty({
    description: 'Base URL for the email service',
    example: 'https://erpnext-marketing.sys-track-overview.site',
  })
  @Prop({ required: true, trim: true })
  baseUrl: string;

  @ApiProperty({
    description: 'Authentication token for the email service',
    example: 'de668493e4344b0:38d508b26d63eba',
  })
  @Prop({ required: true, trim: true })
  token: string;

  @ApiProperty({
    description: 'Array of email accounts for this provider',
    type: [EmailAccount],
  })
  @Prop({ type: [EmailAccountSchema], default: [] })
  emailAccounts: EmailAccount[];

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

export const EmailServiceProviderSchema = SchemaFactory.createForClass(EmailServiceProvider);

// 🔍 Add indexes for better query performance
EmailServiceProviderSchema.index({ name: 1, creator: 1 }, { unique: true });
EmailServiceProviderSchema.index({ baseUrl: 1, creator: 1 }, { unique: true });
EmailServiceProviderSchema.index({ creator: 1, status: 1 });
EmailServiceProviderSchema.index({ default: 1, status: 1 });
EmailServiceProviderSchema.index({ createdAt: -1 });

// 🛡️ Add pre-save middleware to ensure only one default provider per creator
EmailServiceProviderSchema.pre('save', async function(next) {
  if (this.default && this.isModified('default')) {
    // If setting this as default, unset all other defaults for this creator
    await (this.constructor as any).updateMany(
      { creator: this.creator, _id: { $ne: this._id } },
      { $set: { default: false } }
    );
  }
  next();
});

// 🛡️ Add pre-update middleware for findOneAndUpdate operations
EmailServiceProviderSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() as any;
  if (update.$set && update.$set.default === true) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      await this.model.updateMany(
        { creator: doc.creator, _id: { $ne: doc._id } },
        { $set: { default: false } }
      );
    }
  }
  next();
}); 