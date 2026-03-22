import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards';
import { User } from '../../decorators';
import { Scopes } from '../../decorators';
import { METemplateService } from './service';
import { CreateMETemplateDto } from './dto.create';
import { UpdateMETemplateDto } from './dto.update';
import { QueryMETemplateDto } from './dto.query';
import { UserDocument } from '../../schema';

@ApiTags('EMS - Templates')
@ApiBearerAuth()
@Controller(':lang/email-marketing/template')
@UseGuards(AuthGuard())
export class METemplateController {
  constructor(private readonly templateService: METemplateService) {}

  @Post()
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Create a new email template' })
  @ApiResponse({ status: 201, description: 'Template created successfully.' })
  async create(
    @Body() createTemplateDto: CreateMETemplateDto,
    @User() user: UserDocument,
  ) {
    return await this.templateService.create(createTemplateDto, user);
  }

  @Get()
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Get all templates with filters' })
  @ApiResponse({ status: 200, description: 'Return all templates.' })
  async findAll(
    @Query() query: QueryMETemplateDto,
    @User() user: UserDocument,
  ) {
    return this.templateService.findAll(query, user);
  }

  @Get(':id')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'id', required: true, description: 'Template ID' })
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiResponse({ status: 200, description: 'Return the template.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async findOne(
    @Param('id') id: string,
    @User() user: UserDocument,
  ) {
    return this.templateService.findById(id, user);
  }

  @Patch(':id')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'id', required: true, description: 'Template ID' })
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateMETemplateDto,
    @User() user: UserDocument,
  ) {
    return this.templateService.update(id, updateTemplateDto, user);
  }

  @Delete(':id')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'id', required: true, description: 'Template ID' })
  @ApiOperation({ summary: 'Delete a template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async remove(
    @Param('id') id: string,
    @User() user: UserDocument,
  ) {
    await this.templateService.delete(id, user);
    return { success: true, message: 'Template deleted successfully' };
  }

  @Post(':id/increment-usage')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'id', required: true, description: 'Template ID' })
  @ApiOperation({ summary: 'Increment template usage count' })
  @ApiResponse({ status: 200, description: 'Usage count incremented.' })
  async incrementUsage(
    @Param('id') id: string,
    @User() user: UserDocument,
  ) {
    await this.templateService.incrementUsage(id, user);
    return { success: true, message: 'Usage count incremented' };
  }
} 