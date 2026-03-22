import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  Min, 
  IsEnum,
  IsBoolean,
  IsArray,
  IsDateString
} from 'class-validator';
import { TemplateContentType } from './schema';

export enum SortTypeEnum {
  ASCENDING = 'asc',
  DESCENDING = 'desc',
}

export class QueryMETemplateDto {
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

  @ApiProperty({ required: false, description: 'Search by name, subject, or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by content type', enum: TemplateContentType })
  @IsOptional()
  @IsEnum(TemplateContentType)
  contentType?: TemplateContentType;

  @ApiProperty({ required: false, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Filter by tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, description: 'Field to order by', example: 'createdAt' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiProperty({ required: false, description: 'Sort type', enum: SortTypeEnum })
  @IsOptional()
  @IsEnum(SortTypeEnum)
  sortType?: SortTypeEnum;

  @ApiProperty({ required: false, description: 'Created from date' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiProperty({ required: false, description: 'Created to date' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;
} 