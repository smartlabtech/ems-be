import {
  Controller,
  Get,
  Query,
  Res,
  Req,
  HttpStatus,
  BadRequestException,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { TrackingService } from './tracking.service';
import { OpenRateQueryDto, OpenRateResponseDto } from './open-rate-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../decorators';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('EMS - Email Tracking')
@Controller('/tracking')
export class TrackingController {
  private readonly pixelPath: string;

  constructor(
    private readonly trackingService: TrackingService,
  ) {
    this.pixelPath = path.join(process.cwd(), 'assets', 'pixel.png');
  }

  @Get('open')
  @ApiOperation({ summary: 'Track email open via pixel' })
  @ApiQuery({
    name: 'emailId',
    required: true,
    description: 'The unique identifier of the email/message to track'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a 1x1 transparent pixel and updates tracking data'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing or invalid emailId'
  })
  async trackEmailOpen(
    @Query('emailId') emailId: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    // Always return the pixel, even if there's an error
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    try {
      // Set response headers first
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      if (!emailId) {
        console.warn('trackEmailOpen called without emailId');
        res.status(HttpStatus.OK).send(transparentPixel);
        return;
      }

      const ipAddress = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Track the email open asynchronously - don't wait for it
      this.trackingService.trackEmailOpen(emailId, ipAddress, userAgent)
        .catch(err => console.error('Background tracking error:', err));

      // Return the pixel immediately
      if (fs.existsSync(this.pixelPath)) {
        const pixelBuffer = fs.readFileSync(this.pixelPath);
        res.status(HttpStatus.OK).send(pixelBuffer);
      } else {
        res.status(HttpStatus.OK).send(transparentPixel);
      }
    } catch (error) {
      console.error('Error in trackEmailOpen controller:', error);
      // Always return a valid image to avoid broken image icons in emails
      res.status(HttpStatus.OK).send(transparentPixel);
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }

    return req.socket.remoteAddress || 'Unknown';
  }

  @Get('open-rate')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get email open rate statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns email open rate statistics for the specified period',
    type: OpenRateResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async getOpenRate(
    @User() user: any,
    @Query() query: OpenRateQueryDto
  ): Promise<OpenRateResponseDto> {
    return this.trackingService.getOpenRate(user._id, query);
  }

  @Get('debug-tracking')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug endpoint to check tracking data' })
  async debugTracking(
    @User() user: any
  ): Promise<any> {
    return this.trackingService.debugTrackingData(user._id);
  }
}