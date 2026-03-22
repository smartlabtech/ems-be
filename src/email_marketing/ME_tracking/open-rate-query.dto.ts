import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenRateQueryDto {
  @ApiProperty({
    description: 'Number of days to look back for email statistics',
    default: 7,
    required: false,
    minimum: 1,
    example: 7
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number = 7;

  @ApiProperty({
    description: 'Start date for the period (ISO date string)',
    required: false,
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the period (ISO date string)',
    required: false,
    example: '2024-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SenderStatsDto {
  @ApiProperty({
    description: 'Sender email address',
    example: 'sender@example.com'
  })
  sender: string;

  @ApiProperty({
    description: 'Total number of emails sent by this sender',
    example: 50
  })
  totalSent: number;

  @ApiProperty({
    description: 'Total number of unique email opens for this sender',
    example: 25
  })
  totalOpened: number;

  @ApiProperty({
    description: 'Total number of all opens for this sender',
    example: 35
  })
  totalOpenCount: number;

  @ApiProperty({
    description: 'Open rate as a percentage for this sender',
    example: 50.0
  })
  openRate: number;

  @ApiProperty({
    description: 'Average opens per opened email for this sender',
    example: 1.4
  })
  avgOpensPerEmail: number;

  @ApiProperty({
    description: 'Daily breakdown of open rates for this sender',
    example: [
      { date: '2024-01-01', sent: 10, opened: 5, openRate: 50.0 }
    ]
  })
  dailyStats?: Array<{
    date: string;
    sent: number;
    opened: number;
    openRate: number;
  }>;
}

export class OpenRateResponseDto {
  @ApiProperty({
    description: 'Total number of emails sent in the period',
    example: 100
  })
  totalSent: number;

  @ApiProperty({
    description: 'Total number of unique email opens',
    example: 45
  })
  totalOpened: number;

  @ApiProperty({
    description: 'Total number of all opens (including multiple opens)',
    example: 67
  })
  totalOpenCount: number;

  @ApiProperty({
    description: 'Open rate as a percentage',
    example: 45.0
  })
  openRate: number;

  @ApiProperty({
    description: 'Average opens per opened email',
    example: 1.49
  })
  avgOpensPerEmail: number;

  @ApiProperty({
    description: 'Period start date',
    example: '2024-01-01T00:00:00.000Z'
  })
  periodStart: Date;

  @ApiProperty({
    description: 'Period end date',
    example: '2024-01-07T23:59:59.999Z'
  })
  periodEnd: Date;

  @ApiProperty({
    description: 'Statistics grouped by sender email',
    type: [SenderStatsDto],
    example: [
      {
        sender: 'sender1@example.com',
        totalSent: 50,
        totalOpened: 25,
        totalOpenCount: 35,
        openRate: 50.0,
        avgOpensPerEmail: 1.4
      }
    ]
  })
  bySender: SenderStatsDto[];

  @ApiProperty({
    description: 'Daily breakdown of open rates',
    example: [
      { date: '2024-01-01', sent: 10, opened: 5, openRate: 50.0 }
    ]
  })
  dailyStats?: Array<{
    date: string;
    sent: number;
    opened: number;
    openRate: number;
  }>;
}