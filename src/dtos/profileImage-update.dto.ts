import { ApiProperty } from '@nestjs/swagger';
import * as Joi from 'joi';



// tslint:disable-next-line: max-classes-per-file
export class UpdateMyProfileImageDTO {
  @ApiProperty({ description: 'Profile Image', type: String, required: true })
  image: string;
}

export const UpdateMyProfileImageSchema = Joi.object().keys({
  image: Joi.string().required(),
});


export class FileBinaryUploadDto {
  @ApiProperty({ description: 'Binary file', type: 'string', format: 'binary' })
  file: any;
}