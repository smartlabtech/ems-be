import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UsePipes, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JoiValidationPipe } from '../../pipes';
import { CreateTagDto } from './dto.create';
import { UpdateTagDto } from './dto.update';
import { QueryTagDto } from './dto.query';
import { ITag } from './interface';
import { METagService } from './service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards';
import { User } from '../../decorators';
import { UserDocument } from '../../schema';
import { Scopes } from '../../decorators';
import { LanguageSchema } from 'src/dtos';
import { CreateTagSchema } from './dto.create';
import { UpdateTagSchema } from './dto.update';
import { QueryTagSchema } from './dto.query';

@ApiTags('EMS - Tags')
@ApiBearerAuth()
@Controller(':lang/email-marketing/tag')
@UseGuards(AuthGuard())
export class METagController {
  constructor(private readonly tagService: METagService) {}

  @Post()
  @UsePipes(new JoiValidationPipe({ body: CreateTagSchema }))
  async createTag(@Body() createTagDto: CreateTagDto, @User() creator: UserDocument): Promise<ITag> {
    return await this.tagService.createTag(createTagDto, creator);
  }

  @Get()
  @UsePipes(new JoiValidationPipe({ query: QueryTagSchema }))
  async getTags(@Query() filters: QueryTagDto, @User() creator: UserDocument) {
    return await this.tagService.findAllTags(filters, creator);
  }

  @Get(':id')
  async getTagById(@Param('id') id: string, @User() creator: UserDocument): Promise<ITag> {
    return await this.tagService.findTagById(id, creator);
  }

  @Get(':id/groups')
  async getGroupsContainingTag(@Param('id') id: string, @User() creator: UserDocument) {
    return await this.tagService.getGroupsContainingTag(id, creator);
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe({ body: UpdateTagSchema }))
  async updateTag(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto, @User() creator: UserDocument): Promise<ITag> {
    return await this.tagService.updateTag(id, updateTagDto, creator);
  }

  @Delete(':id')
  async deleteTag(@Param('id') id: string, @User() creator: UserDocument): Promise<ITag> {
    return await this.tagService.deleteTag(id, creator);
  }
} 