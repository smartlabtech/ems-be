import { TemplateContentType } from './schema';

export interface IMETemplate {
  _id?: string;
  creator: string;
  name: string;
  subject: string;
  content: string;
  contentType: TemplateContentType;
  isActive: boolean;
  tags: string[];
  description?: string;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMETemplateResponse {
  data: IMETemplate[];
  total: number;
  page: number;
  size: number;
} 