// File: src/email_marketing/email_service_provider/controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  UsePipes,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JoiValidationPipe } from '../../pipes';
import { MongoIdSchema } from '../../dtos';
import { User, Scopes } from '../../decorators';
import { UserDocument } from '../../schema';
import { RolesGuard } from '../../guards';

import { EmailServiceProviderService } from './service';
import { CreateEmailServiceProviderDto, CreateEmailServiceProviderSchema } from './dto.create';
import { UpdateEmailServiceProviderDto, UpdateEmailServiceProviderSchema } from './dto.update';
import { QueryEmailServiceProviderDto, QueryEmailServiceProviderSchema } from './dto.query';
import { IEmailServiceProvider, IEmailTestResult, IEmailServiceProviderResponse } from './interface';
import { SendBulkEmailDto, BulkEmailResponse } from './dto.send-email';

@ApiTags('EMS - Email Service Provider')
@ApiBearerAuth()
@Controller(':lang/email-marketing/email-service-provider')
export class EmailServiceProviderController {
  constructor(
    private readonly emailServiceProviderService: EmailServiceProviderService,
  ) {}

  @Post()
  @UseGuards(AuthGuard())
  @UsePipes(new JoiValidationPipe({
    body: CreateEmailServiceProviderSchema,
  }))
  @ApiOperation({ summary: 'Create a new email service provider' })
  @ApiResponse({ 
    status: 201, 
    description: 'Email service provider created successfully',
    type: CreateEmailServiceProviderDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or email test failed' })
  @ApiResponse({ status: 409, description: 'Conflict - email service provider already exists' })
  async create(
    @Body() data: CreateEmailServiceProviderDto, 
    @User() user: UserDocument
  ): Promise<IEmailServiceProvider> {
    return await this.emailServiceProviderService.create(data, user);
  }

  @Get()
  @UseGuards(AuthGuard())
  @UsePipes(new JoiValidationPipe({
    query: QueryEmailServiceProviderSchema,
  }))
  @ApiOperation({ summary: 'Get all email service providers with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email service providers retrieved successfully' 
  })
  async findAll(
    @Query() query: QueryEmailServiceProviderDto,
    @User() user: UserDocument
  ): Promise<IEmailServiceProviderResponse> {
    return await this.emailServiceProviderService.findAll(query, user);
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  @UsePipes(new JoiValidationPipe({
    param: {
      id: MongoIdSchema,
    }
  }))
  @ApiOperation({ summary: 'Get email service provider by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Email service provider ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email service provider retrieved successfully' 
  })
  @ApiResponse({ status: 404, description: 'Email service provider not found' })
  async findById(
    @Param('id') id: string,
    @User() user: UserDocument
  ): Promise<IEmailServiceProvider> {
    return await this.emailServiceProviderService.findById(id, user);
  }

  @Get('creator/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Scopes('admin:*', 'email-service-provider:admin')
  @UsePipes(new JoiValidationPipe({
    param: {
      id: MongoIdSchema,
    }
  }))
  @ApiOperation({ summary: 'Get email service providers by creator ID (Admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'Creator user ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email service providers retrieved successfully' 
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findByCreator(@Param('id') creatorId: string): Promise<IEmailServiceProvider[]> {
    return await this.emailServiceProviderService.findByCreator(creatorId);
  }

  @Get('default/my')
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: 'Get current user\'s default email service provider' })
  @ApiResponse({ 
    status: 200, 
    description: 'Default email service provider retrieved successfully' 
  })
  @ApiResponse({ status: 404, description: 'No default email service provider found' })
  async findMyDefault(@User() user: UserDocument): Promise<IEmailServiceProvider | null> {
    return await this.emailServiceProviderService.findDefault(user._id.toString());
  }

  @Patch(':id')
  @UseGuards(AuthGuard())
  @UsePipes(new JoiValidationPipe({
    body: UpdateEmailServiceProviderSchema,
    param: {
      id: MongoIdSchema,
    }
  }))
  @ApiOperation({ summary: 'Update email service provider by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Email service provider ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email service provider updated successfully' 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or email test failed' })
  @ApiResponse({ status: 404, description: 'Email service provider not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner of this email service provider' })
  async update(
    @Param('id') id: string, 
    @Body() data: UpdateEmailServiceProviderDto,
    @User() user: UserDocument
  ): Promise<IEmailServiceProvider> {
    return await this.emailServiceProviderService.update(id, data, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Scopes('admin:*', 'email-service-provider:admin')
  @UsePipes(new JoiValidationPipe({
    param: {
      id: MongoIdSchema,
    }
  }))
  @ApiOperation({ summary: 'Delete email service provider by ID (Admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'Email service provider ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email service provider deleted successfully' 
  })
  @ApiResponse({ status: 404, description: 'Email service provider not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async delete(
    @Param('id') id: string,
    @User() user: UserDocument
  ): Promise<{ success: boolean; message: string }> {
    return await this.emailServiceProviderService.deleteAdmin(id, user);
  }

  @Post(':id/test')
  @UseGuards(AuthGuard())
  @UsePipes(new JoiValidationPipe({
    param: {
      id: MongoIdSchema,
    }
  }))
  @ApiOperation({ summary: 'Test email service provider configuration' })
  @ApiParam({ name: 'id', required: true, description: 'Email service provider ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email configuration test completed' 
  })
  @ApiResponse({ status: 404, description: 'Email service provider not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner of this email service provider' })
  async testConfiguration(
    @Param('id') id: string,
    @User() user: UserDocument
  ): Promise<IEmailTestResult> {
    return await this.emailServiceProviderService.testConfiguration(id, user);
  }

  @UseGuards(AuthGuard(), RolesGuard)
  @Post('send-bulk-emails')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send bulk emails to multiple recipients',
    description: 'Send emails to a list of recipients using a specific email service provider' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Emails sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        totalRecipients: { type: 'number' },
        successCount: { type: 'number' },
        failureCount: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              success: { type: 'boolean' },
              messageId: { type: 'string' },
              error: { type: 'string' }
            }
          }
        },
        batchInfo: {
          type: 'object',
          properties: {
            totalBatches: { type: 'number' },
            processedBatches: { type: 'number' },
            batchSize: { type: 'number' }
          }
        },
        processingTime: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Email service provider not found' })
  @ApiBearerAuth()
  async sendBulkEmails(
    @Body() sendBulkEmailDto: SendBulkEmailDto,
    @User() user: UserDocument,
  ): Promise<BulkEmailResponse> {
    return this.emailServiceProviderService.sendBulkEmails(sendBulkEmailDto, user);
  }
} 