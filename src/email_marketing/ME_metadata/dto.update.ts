import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateParameterDto {
  @ApiProperty({ 
    description: 'The value to update the parameter with',
    example: { key: 'value', anotherKey: 123 }
  })
  value: any;

  @ApiProperty({ 
    description: 'Whether to merge with existing value or replace it completely',
    default: true,
    required: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  merge?: boolean;
}