import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMEMessageDto } from './dto.create';

export class UpdateMEMessageDto extends PartialType(
  OmitType(CreateMEMessageDto, ['sender'] as const)
) {} 