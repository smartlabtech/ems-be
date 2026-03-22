import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UsePipes, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JoiValidationPipe } from '../../pipes';
import { CreateGroupDto } from './dto.create';
import { UpdateGroupDto } from './dto.update';
import { QueryGroupDto } from './dto.query';
import { IGroup } from './interface';
import { MEGroupService } from './service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards';
import { User } from '../../decorators';
import { UserDocument } from '../../schema';
import { Scopes } from '../../decorators';
import { LanguageSchema } from 'src/dtos';
import { CreateGroupSchema } from './dto.create';
import { UpdateGroupSchema } from './dto.update';
import { QueryGroupSchema } from './dto.query';

@ApiTags('EMS - Groups')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@Controller(':lang/email-marketing/group')
export class MEGroupController {
  constructor(private readonly groupService: MEGroupService) {}

  @Post()
  @UsePipes(new JoiValidationPipe({ body: CreateGroupSchema }))
  async createGroup(@Body() createGroupDto: CreateGroupDto, @User() creator: UserDocument): Promise<IGroup> {
    console.log(createGroupDto);
    return await this.groupService.createGroup(createGroupDto, creator);
  }

  @Get()
  @UsePipes(new JoiValidationPipe({ query: QueryGroupSchema }))
  async getGroups(@Query() filters: QueryGroupDto, @User() creator: UserDocument) {
    return await this.groupService.findAllGroups(filters, creator);
  }

  @Get(':id')
  async getGroupById(@Param('id') id: string, @User() creator: UserDocument): Promise<IGroup> {
    return await this.groupService.findGroupById(id, creator);
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe({ body: UpdateGroupSchema }))
  async updateGroup(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto, @User() creator: UserDocument): Promise<IGroup> {
    return await this.groupService.updateGroup(id, updateGroupDto, creator);
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string, @User() creator: UserDocument): Promise<IGroup> {
    return await this.groupService.deleteGroup(id, creator);
  }
} 