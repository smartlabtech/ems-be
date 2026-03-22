import { ApiProperty } from '@nestjs/swagger';
import * as Joi from 'joi';
import { statusEnum } from '../enums';
import { EmailSchema } from './email.dto';
import { roleEnum } from 'src/enums/user-role.enum';
import { MongoIdSchema } from './mongo-id.dto';
import { genderEnum } from 'src/enums/gender.enum';
export class UpdateUserDTO {
  @ApiProperty({ description: 'first Name', type: String, required: false })
  firstName: string;

  @ApiProperty({ description: 'father Name', type: String, required: false })
  lastName: string;

  @ApiProperty({ description: 'image', type: String, required: false })
  image: string;

  @ApiProperty({ description: 'mobile', type: String, required: false })
  mobile?: string;

  @ApiProperty({ description: 'User skills', type: [String], required: false })
  skills?: string[];

  @ApiProperty({ description: 'Social media links', type: Object, required: false })
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    website?: string;
  };

  @ApiProperty({ description: 'User location', type: String, required: false })
  location?: string;


  @ApiProperty({ description: 'Last active timestamp', type: Date, required: false })
  lastActive?: Date;

  @ApiProperty({ description: 'bio', type: String, required: false })
  bio?: string;

  @ApiProperty({ description: 'visible To Community', type: Boolean, required: false })
  visibleToCommunity?: boolean;
}


export const UpdateUserSchema = Joi.object().keys({
  firstName: Joi.string(),
  lastName: Joi.string(),
  image: Joi.string().allow(""),
  mobile: Joi.string().allow(""),
  skills: Joi.array().items(Joi.string()),
  socialLinks: Joi.object({
    linkedin: Joi.string().allow(""),
    twitter: Joi.string().allow(""),
    whatsapp: Joi.string().allow(""),
    facebook: Joi.string().allow(""),
    instagram: Joi.string().allow(""),
    youtube: Joi.string().allow(""),
    github: Joi.string().allow(""),
    website: Joi.string().allow("")
  }),
  location: Joi.string().allow(""),
  lastActive: Joi.date(),
  bio: Joi.string().allow(""),
  visibleToCommunity: Joi.boolean().allow(""),
});

export class RoleDTO {
  @ApiProperty({ description: `role ${Object.keys(roleEnum).join()}`, enum: roleEnum, required: true })
  role: string;
}

export const RoleSchema = Joi.object().keys({
  role: Joi.string().valid(...Object.keys(roleEnum)).required(),
});