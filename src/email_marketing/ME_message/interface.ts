import { MessageContentType } from './schema';

export interface ITag {
  id: string;
  name: string;
  status: string;
}

export interface IMEMessage {
  _id?: string;
  creator: string;
  sender: string;
  message_id: string;
  in_reply_to?: string;
  references: string[];
  subject: string;
  message: string;
  contentType: MessageContentType;
  to: string[];
  cc: string[];
  bcc: string[];
  belongToMessageId?: string;
  sent_or_received: string;
  delivery_status?: string;
  timestamp?: Date;
  readAt?: Date;
  isRead: boolean;
  providerId: string;
  providerMessageId?: string;
  headers?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    url?: string;
  }>;
  metadata?: Record<string, any>;
  error?: string;
  retryCount: number;
  lastRetryAt?: Date;
  messageData?: Record<string, any>;
  tags?: ITag[];
  relatedMessages?: IMEMessage[];
  isLatestInThread?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMEMessageResponse {
  data: IMEMessage[];
  total: number;
  page: number;
  size: number;
} 