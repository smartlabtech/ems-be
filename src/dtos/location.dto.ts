import { ApiProperty } from '@nestjs/swagger';
import * as Joi from 'joi';

export class LocationDTO {
  @ApiProperty({description: 'arabic name', type: String, required: true})
  ar?: string;

  @ApiProperty({description: 'english name', type: String, required: true})
  en?: string;
}
export const LocationSchema = Joi.object().keys({
  ar: Joi.string().required(),
  en: Joi.string().required(),
});