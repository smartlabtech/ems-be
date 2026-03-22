import { PartialType } from '@nestjs/swagger';
import { CreateMETemplateDto } from './dto.create';

export class UpdateMETemplateDto extends PartialType(CreateMETemplateDto) {} 