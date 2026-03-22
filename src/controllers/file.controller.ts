import { Controller, UsePipes, UseGuards, Body, Post, Get, UploadedFile, UseInterceptors, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileService } from '../services';
import { FileInterceptor } from '@nestjs/platform-express';

import { Scopes, User } from '../decorators';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards';
import { JoiValidationPipe } from '../pipes';
import { FileBase64UploadDto, FileBase64UploadSchema, FileBinaryUploadDto, LanguageSchema, UploadTypeSchema } from '../dtos';

@ApiTags('Upload files')
@ApiBearerAuth()
@Controller(':lang/upload')

export class FileController {
  constructor(
    private readonly fileService: FileService,
  ) { }

  // @Post('base64/:type')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @UsePipes(new JoiValidationPipe({
  //   body: FileBase64UploadSchema,
  //   param: {
  //     lang: LanguageSchema,
  //     type: UploadTypeSchema,
  //   },
  // }))
  // @Scopes('upload:create')
  // async uploadBase64(
  //   @Body() body: FileBinaryUploadDto,
  //   @Param('lang') lang: string,
  //   @Param('type') type: string
  // ): Promise<{ url: string }> {
  //   return await this.fileService.uploadBase64(body.file, lang, type, body.userId);
  // }


  // @Post(':type')
  // @UsePipes(new JoiValidationPipe({
  //   param: {
  //     lang: LanguageSchema,
  //     type: UploadTypeSchema,
  //   },
  // }))
  // @UseInterceptors(FileInterceptor('file'))
  // @ApiConsumes('multipart/form-data')
  // @UseGuards(AuthGuard(), RolesGuard)

  // //@Scopes('upload:create')
  // async upload(
  //   @Body() body: FileBinaryUploadDto,
  //   // @UploadedFile() file,
  //   @Param('lang') lang: string,
  //   @Param('type') type: string,
  // ): Promise<{ url: string }> {
  //   return await this.fileService.uploadBinary(body.file, lang, type, body.userId);
  // }

}
