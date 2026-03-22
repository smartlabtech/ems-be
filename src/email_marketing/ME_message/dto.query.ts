import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  Min, 
  IsEnum,
  IsBoolean,
  IsDateString,
  IsEmail
} from 'class-validator';
import { MessageContentType } from './schema';

export enum SortTypeEnum {
  ASCENDING = 'asc',
  DESCENDING = 'desc',
}

export class QueryMEMessageDto {
  @ApiProperty({ required: false, description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, description: 'Page size', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  size?: number;

  @ApiProperty({ required: false, description: 'Search in subject and message' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by sender email' })
  @IsOptional()
  @IsEmail()
  sender?: string;

  @ApiProperty({ required: false, description: 'Filter by recipient email' })
  @IsOptional()
  @IsEmail()
  recipient?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by email address (matches either sender or recipient)',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Filter by whether message was sent or received', example: 'sent' })
  @IsOptional()
  @IsString()
  sent_or_received?: string;

  @ApiProperty({ required: false, description: 'Filter by delivery status', example: 'delivered' })
  @IsOptional()
  @IsString()
  delivery_status?: string;

  @ApiProperty({ required: false, description: 'Filter by content type', enum: MessageContentType })
  @IsOptional()
  @IsEnum(MessageContentType)
  contentType?: MessageContentType;

  @ApiProperty({ required: false, description: 'Filter by read status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiProperty({ required: false, description: 'Filter by thread ID' })
  @IsOptional()
  @IsString()
  belongToMessageId?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by tag IDs (comma-separated)', 
    example: '60d21b4667d0d8992e610c85,60d21b4667d0d8992e610c86' 
  })
  @IsOptional()
  @IsString()
  tagIds?: string;

  @ApiProperty({ required: false, description: 'Field to order by', example: 'createdAt' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiProperty({ required: false, description: 'Sort type', enum: SortTypeEnum })
  @IsOptional()
  @IsEnum(SortTypeEnum)
  sortType?: SortTypeEnum;

  @ApiProperty({ required: false, description: 'Timestamp from date' })
  @IsOptional()
  @IsDateString()
  timestampFrom?: string;

  @ApiProperty({ required: false, description: 'Timestamp to date' })
  @IsOptional()
  @IsDateString()
  timestampTo?: string;

  @ApiProperty({ required: false, description: 'Created from date' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiProperty({ required: false, description: 'Created to date' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiProperty({ required: false, description: 'Include related messages in the response' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeRelated?: boolean;
} 