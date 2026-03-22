import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UsePipes, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JoiValidationPipe } from '../../pipes';
import { UpdateTaggedByDto } from './dto.update';
import { QueryTaggedByDto } from './dto.query';
import { ITaggedBy } from './interface';
import { METaggedByService } from './service';
import { CreateTaggedByDto } from './dto.create';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards';
import { User } from '../../decorators';
import { UserDocument } from '../../schema';
import { Scopes } from '../../decorators';
import { LanguageSchema } from 'src/dtos';
import { CreateTaggedBySchema } from './dto.create';
import { UpdateTaggedBySchema } from './dto.update';
import { QueryTaggedBySchema } from './dto.query';

@ApiTags('EMS - Tagged By')
@ApiBearerAuth()
@Controller(':lang/email-marketing/tagged-by')
@UseGuards(AuthGuard())
export class METaggedByController {
  private readonly logger = new Logger(METaggedByController.name);

  constructor(private readonly taggedByService: METaggedByService) {}

  @Post()
  @UsePipes(new JoiValidationPipe({ body: CreateTaggedBySchema }))
  async createTaggedBy(@Body() createTaggedByDto: CreateTaggedByDto, @User() creator: UserDocument): Promise<ITaggedBy> {
    try {
      this.logger.log(`Creating tagged-by relationship: ${JSON.stringify(createTaggedByDto)}`);
      this.logger.log(`Creator info: ID=${creator._id}, Email=${creator.email}`);
      
      const result = await this.taggedByService.createTaggedBy(createTaggedByDto, creator);
      this.logger.log(`Successfully created tagged-by relationship with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create tagged-by relationship: ${error.message}`, error.stack);
      
      // Re-throw known exceptions (they have proper HTTP status codes)
      if (error.name === 'NotFoundException' || error.name === 'ConflictException' || error.name === 'BadRequestException') {
        throw error;
      }
      
      // For unknown errors, throw a more descriptive BadRequestException
      throw new BadRequestException(`Failed to create tag assignment: ${error.message || 'Unknown error'}`);
    }
  }

  @Get()
  @UsePipes(new JoiValidationPipe({ query: QueryTaggedBySchema }))
  async getTaggedBys(@Query() filters: QueryTaggedByDto, @User() creator: UserDocument) {
    return await this.taggedByService.findAllTaggedBys(filters, creator);
  }

  @Get(':id')
  async getTaggedByById(@Param('id') id: string, @User() creator: UserDocument): Promise<ITaggedBy> {
    return await this.taggedByService.findTaggedByById(id, creator);
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe({ body: UpdateTaggedBySchema }))
  async updateTaggedBy(@Param('id') id: string, @Body() updateTaggedByDto: UpdateTaggedByDto, @User() creator: UserDocument): Promise<ITaggedBy> {
    return await this.taggedByService.updateTaggedBy(id, updateTaggedByDto, creator);
  }

  @Delete(':id')
  async deleteTaggedBy(@Param('id') id: string, @User() creator: UserDocument): Promise<ITaggedBy> {
    return await this.taggedByService.deleteTaggedBy(id, creator);
  }

  @Delete()
  async deleteTaggedByEmailAndTag(@Query('emailId') emailId: string, @Query('tagId') tagId: string, @User() creator: UserDocument): Promise<ITaggedBy> {
    if (!emailId || !tagId) {
      throw new BadRequestException('Both emailId and tagId are required');
    }
    return await this.taggedByService.deleteTaggedByEmailAndTag(emailId, tagId, creator);
  }
} 