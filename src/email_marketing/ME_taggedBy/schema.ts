import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TaggedByStatus, TaggedEntityType } from './enum';

export type METaggedByDocument = ME_taggedBy & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'me_tagged_by',
})
export class ME_taggedBy {
  @ApiProperty({
    description: 'Type of entity being tagged',
    enum: TaggedEntityType,
    example: TaggedEntityType.EMAIL,
  })
  @Prop({ type: String, enum: TaggedEntityType, required: true })
  entityType: TaggedEntityType;

  @ApiProperty({
    description: 'ID of the entity being tagged (email, message, etc.)',
    example: '60d21b4667d0d8992e610c85',
    type: String,
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  entityId: mongoose.Schema.Types.ObjectId;

  @ApiProperty({
    description: 'Reference to the tag document',
    example: '60d21b4667d0d8992e610c99',
    type: String,
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ME_tag', required: true })
  tagId: mongoose.Schema.Types.ObjectId;

  @ApiProperty({
    description: 'Status of the taggedBy relation',
    enum: TaggedByStatus,
    example: TaggedByStatus.ACTIVE,
    default: TaggedByStatus.ACTIVE,
  })
  @Prop({ type: String, enum: TaggedByStatus, default: TaggedByStatus.ACTIVE })
  status: TaggedByStatus;

  @ApiProperty({
    description: 'ID of the user who created the taggedBy relation',
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

export const METaggedBySchema = SchemaFactory.createForClass(ME_taggedBy);

// Create indexes
METaggedBySchema.index({ entityType: 1, entityId: 1, tagId: 1, creator: 1 }, { 
  unique: true, 
  name: 'unique_entity_tag_creator',
  background: true 
});
METaggedBySchema.index({ entityType: 1, status: 1 });
METaggedBySchema.index({ tagId: 1, status: 1 });
METaggedBySchema.index({ creator: 1, entityType: 1 }); 