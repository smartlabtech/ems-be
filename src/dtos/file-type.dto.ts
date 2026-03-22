import * as Joi from 'joi';
import { FileTypeEnum } from '../enums';

export const UploadTypeSchema = Joi.string().valid(...Object.keys(FileTypeEnum)).required();