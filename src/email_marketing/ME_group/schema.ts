import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { GroupStatus } from './enum';

export type MEGroupDocument = ME_group & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'me_group',
})
export class ME_group {
  @ApiProperty({
    description: 'Group name',
    example: 'Marketing Team',
    minLength: 2,
    maxLength: 50,
  })
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  name: string;

  @ApiProperty({
    description: 'Group description',
    example: 'This group is for the marketing team and related activities.',
    maxLength: 500,
    required: false,
  })
  @Prop({ required: false, trim: true, maxlength: 500 })
  description: string;

  @ApiProperty({
    description: 'Array of tag IDs related to this group',
    example: ['60d21b4667d0d8992e610c85', '60d21b4667d0d8992e610c86'],
    type: [String],
    required: false,
  })
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }], default: [] })
  tags: mongoose.Schema.Types.ObjectId[];

  @ApiProperty({
    description: 'Status of the group',
    enum: GroupStatus,
    example: GroupStatus.ACTIVE,
    default: GroupStatus.ACTIVE,
  })
  @Prop({ type: String, enum: GroupStatus, default: GroupStatus.ACTIVE })
  status: GroupStatus;

  @ApiProperty({
    description: 'ID of the user who created the group',
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

export const MEGroupSchema = SchemaFactory.createForClass(ME_group);
MEGroupSchema.index({ name: 1, creator: 1 }, { unique: true }); 