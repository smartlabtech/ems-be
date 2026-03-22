import { Document } from 'mongoose';
import { GroupStatus } from './enum';

export interface IGroup {
  id?: string;
  name: string;
  description?: string;
  tags: string[];
  status: GroupStatus;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupDocument extends Omit<IGroup, 'id'>, Document {} 