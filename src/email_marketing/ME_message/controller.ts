import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../decorators';
import { MEMessageService } from './service';
import { CreateMEMessageDto } from './dto.create';
import { UpdateMEMessageDto } from './dto.update';
import { QueryMEMessageDto } from './dto.query';
import { UserDocument } from '../../schema';

@ApiTags('EMS - Messages')
@ApiBearerAuth()
@Controller(':lang/email-marketing/message')
@UseGuards(AuthGuard())
export class MEMessageController {
  constructor(private readonly messageService: MEMessageService) {}

  @Post()
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, description: 'Message created successfully.' })
  async create(
    @Body() createMessageDto: CreateMEMessageDto,
    @User() user: UserDocument,
  ) {
    return this.messageService.create(createMessageDto, user);
  }

  @Post('bulk')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Create multiple messages' })
  @ApiResponse({ status: 201, description: 'Messages created successfully.' })
  async createBulk(
    @Body() messages: CreateMEMessageDto[],
    @User() user: UserDocument,
  ) {
    return this.messageService.createBulk(messages, user);
  }

  @Get()
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Get all messages with filters' })
  @ApiResponse({ status: 200, description: 'Return all messages.' })
  async findAll(
    @Query() query: QueryMEMessageDto,
    @User() user: UserDocument,
  ) {
    return this.messageService.findAll(query, user);
  }

  @Get('latest-per-thread')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Get only the latest message from each thread' })
  @ApiResponse({ status: 200, description: 'Return latest messages per thread.' })
  async getLatestPerThread(
    @Query() query: QueryMEMessageDto,
    @User() user: UserDocument,
  ) {
    return this.messageService.getLatestMessagesPerThread(query, user);
  }

  @Get(':id')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'id', required: true, description: 'Message ID' })
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiResponse({ status: 200, description: 'Return the message.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  async findOne(
    @Param('id') id: string,
    @Query('includeRelated') includeRelated: boolean,
    @User() user: UserDocument,
  ) {
    return this.messageService.findById(id, user, includeRelated);
  }

  @Get('by-message-id/:messageId')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'messageId', required: true, description: 'Message ID (email message ID)' })
  @ApiOperation({ summary: 'Get a message by message_id' })
  @ApiResponse({ status: 200, description: 'Return the message.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  async findByMessageId(
    @Param('messageId') messageId: string,
    @User() user: UserDocument,
  ) {
    return this.messageService.findByMessageId(messageId, user);
  }

  @Get('thread/:threadId')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'threadId', required: true, description: 'Thread ID' })
  @ApiOperation({ summary: 'Get all messages in a thread' })
  @ApiResponse({ status: 200, description: 'Return thread messages.' })
  async getThreadMessages(
    @Param('threadId') threadId: string,
    @User() user: UserDocument,
  ) {
    return this.messageService.getThreadMessages(threadId, user);
  }

  @Patch(':id')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'id', required: true, description: 'Message ID' })
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMEMessageDto,
    @User() user: UserDocument,
  ) {
    return this.messageService.update(id, updateMessageDto, user);
  }

  @Put(':id/mark-read')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'id', required: true, description: 'Message ID' })
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  async markAsRead(
    @Param('id') id: string,
    @User() user: UserDocument,
  ) {
    return this.messageService.markAsRead(id, user);
  }

  @Delete(':id')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiParam({ name: 'id', required: true, description: 'Message ID' })
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  async remove(
    @Param('id') id: string,
    @User() user: UserDocument,
  ) {
    await this.messageService.delete(id, user);
    return { success: true, message: 'Message deleted successfully' };
  }

  @Post('cleanup/belong-to-message-id')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Clean up belongToMessageId field issues' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully.' })
  async cleanupBelongToMessageId(
    @User() user: UserDocument,
  ) {
    const result = await this.messageService.cleanupBelongToMessageId(user);
    return {
      success: true,
      message: `Cleanup completed. Fixed: ${result.fixed}, Failed: ${result.failed}`,
      ...result
    };
  }

  @Get('debug/check-belong-to')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Debug endpoint to check belongToMessageId values' })
  @ApiResponse({ status: 200, description: 'Return debug info.' })
  async debugBelongTo(
    @User() user: UserDocument,
  ) {
    return this.messageService.debugBelongToMessageId(user);
  }

  @Get('debug/thread-summary')
  @ApiParam({ name: 'lang', required: true, description: 'Language code', example: 'en' })
  @ApiOperation({ summary: 'Debug endpoint to get thread summary' })
  @ApiResponse({ status: 200, description: 'Return thread summary.' })
  async debugThreadSummary(
    @User() user: UserDocument,
  ) {
    return this.messageService.debugThreadSummary(user);
  }
} 