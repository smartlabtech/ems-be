import { Document } from 'mongoose';
import { EmailStatus, EmailSource } from './enum';

export interface IEmail {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  whatsapp?: string;
  status: EmailStatus;
  source: EmailSource;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export interface IEmailDocument extends Omit<IEmail, 'id'>, Document {} 