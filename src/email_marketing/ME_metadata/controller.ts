import {
  Controller,
  Get,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MEMetadataService } from './service';
import { User } from '../../decorators';
import { UserDocument } from '../../schema';
import { UpdateParameterDto } from './dto.update';

@ApiTags('EMS - Metadata')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@Controller(':lang/email-marketing/metadata')
export class MEMetadataController {
  constructor(private readonly metadataService: MEMetadataService) {}

  @Get('parameter/:parameter')
  @ApiParam({ name: 'lang', enum: ['en', 'ar'], description: 'Language code' })
  @ApiParam({ name: 'parameter', description: 'Parameter name to retrieve' })
  async getParameter(
    @Param('parameter') parameter: string,
    @User() user: UserDocument,
  ) {
    const value = await this.metadataService.getParameter(parameter, user);
    return { data: value };
  }

  @Patch('parameter/:parameter')
  @ApiParam({ name: 'lang', enum: ['en', 'ar'], description: 'Language code' })
  @ApiParam({ name: 'parameter', description: 'Parameter name to update' })
  async updateParameter(
    @Param('parameter') parameter: string,
    @Body() body: UpdateParameterDto,
    @User() user: UserDocument,
  ) {
    console.log('PATCH request received');
    console.log('Parameter:', parameter);
    console.log('Body:', body);
    console.log('User:', user?._id);
    
    try {
      const result = await this.metadataService.updateParameter(
        parameter, 
        body.value, 
        user, 
        body.merge ?? true
      );
      console.log('Update successful:', result);
      return result;
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  }
}