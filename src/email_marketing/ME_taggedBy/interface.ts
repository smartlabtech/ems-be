import { Document } from 'mongoose';
import { TaggedEntityType } from './enum';

export interface ITaggedBy {
  id?: string;
  entityType: TaggedEntityType;
  entityId: string;
  tagId: string;
  status?: string;
  creator?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITaggedByDocument extends Omit<ITaggedBy, 'id'>, Document {} 