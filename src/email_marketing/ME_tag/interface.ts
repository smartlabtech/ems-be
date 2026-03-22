import { Document } from 'mongoose';
import { TagStatus, TagType } from './enum';

export interface ITag {
  id?: string;
  name: string;
  type: TagType;
  status: TagStatus;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  emailCount?: number;
  messageCount?: number;
}

export interface ITagDocument extends Omit<ITag, 'id'>, Document {} 