import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UsePipes, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JoiValidationPipe } from '../../pipes';
import { CreateEmailDto } from './dto.create';
import { UpdateEmailDto } from './dto.update';
import { QueryEmailDto, QueryEmailSchema } from './dto.query';
import { IEmail } from './interface';
import { MEEmailService } from './service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards';
import { User } from '../../decorators';
import { UserDocument } from '../../schema';
import { Scopes } from '../../decorators';
import { LanguageSchema } from 'src/dtos';
import { CreateEmailSchema } from './dto.create';
import { UpdateEmailSchema } from './dto.update';

@ApiTags('EMS - Emails')
@ApiBearerAuth()
@Controller(':lang/email-marketing/email')
@UseGuards(AuthGuard())
export class MEEmailController {
  constructor(private readonly emailService: MEEmailService) {}

  @Post()
  @UsePipes(new JoiValidationPipe({ body: CreateEmailSchema }))
  async createEmail(@Body() createEmailDto: CreateEmailDto, @User() creator: UserDocument): Promise<IEmail> {
    return await this.emailService.createEmail(createEmailDto, creator);
  }

  @Get()
  @UsePipes(new JoiValidationPipe({ query: QueryEmailSchema }))
  async getEmails(@Query() filters: QueryEmailDto, @User() creator: UserDocument) {
    return await this.emailService.findAllEmails(filters, creator);
  }

  @Get(':id')
  async getEmailById(@Param('id') id: string, @User() creator: UserDocument): Promise<IEmail> {
    return await this.emailService.findEmailById(id, creator);
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe({ body: UpdateEmailSchema }))
  async updateEmail(@Param('id') id: string, @Body() updateEmailDto: UpdateEmailDto, @User() creator: UserDocument): Promise<IEmail> {
    return await this.emailService.updateEmail(id, updateEmailDto, creator);
  }

  @Delete(':id')
  async deleteEmail(@Param('id') id: string, @User() creator: UserDocument): Promise<IEmail> {
    return await this.emailService.deleteEmail(id, creator);
  }
} 