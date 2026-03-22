import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MEMetadataDocument = ME_metadata & Document;

@Schema({ 
  timestamps: true,
  versionKey: false,
  collection: 'me_metadata',
  strict: false // Allow dynamic fields
})
export class ME_metadata {
  @ApiProperty({
    description: 'ID of the user who owns this metadata',
    example: '60d21b4667d0d8992e610c85'
  })
  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // Each user has only one metadata document
  })
  creator: mongoose.Schema.Types.ObjectId;

  @ApiProperty({
    description: 'Email domain configuration data',
    example: {
      domains: {
        'example.com': {
          logo: 'https://example.com/logo.png',
          companyName: 'Example Corp',
          address: '123 Main St, City',
          supportEmail: 'support@example.com',
          website: 'https://example.com'
        }
      }
    }
  })
  @Prop({ 
    type: mongoose.Schema.Types.Mixed,
    default: {}
  })
  meta_data?: any;

  // Any other parameters can be added dynamically
  // For example: marketing, templates, settings, etc.

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

export const MEMetadataSchema = SchemaFactory.createForClass(ME_metadata);

// Add index for faster lookup
MEMetadataSchema.index({ creator: 1 });