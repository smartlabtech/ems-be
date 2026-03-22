import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { EmailStatus, EmailSource } from './enum';

export type MEEmailDocument = ME_email & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'me_email',
})
export class ME_email {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    uniqueItems: true,
  })
  @Prop({ required: true, trim: true })
  email: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  @Prop({ required: false, trim: true })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  @Prop({ required: false, trim: true })
  lastName: string;

  @ApiProperty({
    description: 'Mobile number',
    example: '+1234567890',
    required: false,
  })
  @Prop({ required: false, trim: true })
  mobile: string;

  @ApiProperty({
    description: 'WhatsApp number',
    example: '+1234567890',
    required: false,
  })
  @Prop({ required: false, trim: true })
  whatsapp: string;

  @ApiProperty({
    description: 'Status of the email',
    enum: EmailStatus,
    example: EmailStatus.ACTIVE,
    default: EmailStatus.ACTIVE,
  })
  @Prop({ type: String, enum: EmailStatus, default: EmailStatus.ACTIVE })
  status: EmailStatus;

  @ApiProperty({
    description: 'Source of the email (In for incoming, Out for outgoing)',
    enum: EmailSource,
    example: EmailSource.IN,
    default: EmailSource.IN,
    readOnly: true,
  })
  @Prop({ type: String, enum: EmailSource, default: EmailSource.IN })
  source: EmailSource;

  @ApiProperty({
    description: 'ID of the user who created the email',
    example: '60d21b4667d0d8992e610c85'
  })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  })
  creator: mongoose.Schema.Types.ObjectId;

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

export const MEEmailSchema = SchemaFactory.createForClass(ME_email);
MEEmailSchema.index({ email: 1, creator: 1 }, { unique: true });
// Indexes for filtering and sorting
MEEmailSchema.index({ creator: 1, createdAt: -1 }); // For listing and export
MEEmailSchema.index({ creator: 1, source: 1 }); // For source filtering
MEEmailSchema.index({ creator: 1, status: 1 }); // For status filtering 