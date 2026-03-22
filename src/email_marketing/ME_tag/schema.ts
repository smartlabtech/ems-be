import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TagStatus, TagType } from './enum';

export type METagDocument = ME_tag & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'me_tag',
})
export class ME_tag {
  @ApiProperty({
    description: 'Tag name',
    example: 'Newsletter',
  })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({
    description: 'Type of the tag (email or message)',
    enum: TagType,
    example: TagType.EMAIL,
  })
  @Prop({ type: String, enum: TagType, required: true })
  type: TagType;

  @ApiProperty({
    description: 'Status of the tag',
    enum: TagStatus,
    example: TagStatus.ACTIVE,
    default: TagStatus.ACTIVE,
  })
  @Prop({ type: String, enum: TagStatus, default: TagStatus.ACTIVE })
  status: TagStatus;

  @ApiProperty({
    description: 'ID of the user who created the tag',
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

export const METagSchema = SchemaFactory.createForClass(ME_tag);
METagSchema.index({ name: 1, type: 1, creator: 1 }, { unique: true }); 