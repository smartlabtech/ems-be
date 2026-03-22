import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type METemplateDocument = ME_template & Document;

export enum TemplateContentType {
  HTML = 'html',
  TEXT = 'text',
}

@Schema({ 
  timestamps: true,
  versionKey: false,
  collection: 'me_template',
})
export class ME_template {
  @ApiProperty({
    description: 'ID of the user who created the template',
    example: '60d21b4667d0d8992e610c85'
  })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  })
  creator: mongoose.Schema.Types.ObjectId;

  @ApiProperty({
    description: 'Template name',
    example: 'Welcome Email Template'
  })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Welcome to {{companyName}}!'
  })
  @Prop({ required: true, trim: true })
  subject: string;

  @ApiProperty({
    description: 'Email content template',
    example: '<h1>Hello {{firstName}}!</h1>'
  })
  @Prop({ required: true })
  content: string;

  @ApiProperty({
    description: 'Content type',
    enum: TemplateContentType,
    default: TemplateContentType.HTML
  })
  @Prop({ 
    type: String, 
    enum: TemplateContentType, 
    default: TemplateContentType.HTML 
  })
  contentType: TemplateContentType;

  @ApiProperty({
    description: 'Is template active',
    default: true
  })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Template tags',
    example: ['welcome', 'onboarding']
  })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({
    description: 'Template description',
    example: 'Used for welcoming new users'
  })
  @Prop()
  description?: string;

  @ApiProperty({
    description: 'Usage count',
    default: 0
  })
  @Prop({ default: 0 })
  usageCount: number;

  @ApiProperty({
    description: 'Last used timestamp'
  })
  @Prop()
  lastUsedAt?: Date;

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

export const METemplateSchema = SchemaFactory.createForClass(ME_template);
METemplateSchema.index({ name: 1, creator: 1 }, { unique: true }); 