import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ME_message, MEMessageDocument } from '../ME_message/schema';
import { OpenRateQueryDto, OpenRateResponseDto, SenderStatsDto } from './open-rate-query.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(ME_message.name)
    private readonly meMessageModel: Model<MEMessageDocument>,
  ) { }

  async trackEmailOpen(messageId: string, ipAddress: string, userAgent: string): Promise<void> {
    try {
      // Validate the messageId is a valid MongoDB ObjectId
      if (!Types.ObjectId.isValid(messageId)) {
        console.warn(`Invalid message ID format: ${messageId}`);
        return;
      }

      const message = await this.meMessageModel.findById(messageId);

      if (!message) {
        console.warn(`Message with ID ${messageId} not found for tracking`);
        return;
      }

      const trackingData = {
        openedAt: new Date(),
        openedIp: ipAddress,
        openedUserAgent: userAgent,
        isOpened: true,
      };

      // Initialize metadata if it doesn't exist
      if (!message.metadata) {
        message.metadata = {};
      }

      if (!message.metadata.tracking) {
        message.metadata.tracking = {};
      }

      // Track first open time
      if (!message.metadata.tracking.firstOpenedAt) {
        message.metadata.tracking.firstOpenedAt = trackingData.openedAt;
      }

      // Update tracking data
      message.metadata.tracking = {
        ...message.metadata.tracking,
        ...trackingData,
        openCount: (message.metadata.tracking.openCount || 0) + 1,
      };

      // Mark message as read if not already
      if (!message.isRead) {
        message.isRead = true;
        message.readAt = trackingData.openedAt;
      }

      // Mark the metadata field as modified so Mongoose knows to save it
      message.markModified('metadata');
      message.markModified('metadata.tracking');

      // Save the updated message directly
      await message.save();

      console.log(`Email open tracked for message ${messageId} from IP ${ipAddress}`);
    } catch (error) {
      console.error(`Error tracking email open for message ${messageId}:`, error);
      // Don't throw error to avoid showing errors to email recipients
      // Just log it and return silently
    }
  }

  async getTrackingStats(messageId: string): Promise<any> {
    const message = await this.meMessageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    return message.metadata?.tracking || {
      isOpened: false,
      openCount: 0,
    };
  }

  async debugTrackingData(userId: string): Promise<any> {
    const allMessages = await this.meMessageModel.find({
      creator: new Types.ObjectId(userId),
    }).limit(10);

    const sentMessages = await this.meMessageModel.find({
      creator: new Types.ObjectId(userId),
      sent_or_received: 'sent',
    }).limit(10);

    const originalSentMessages = await this.meMessageModel.find({
      creator: new Types.ObjectId(userId),
      sent_or_received: 'sent',
      $or: [
        { in_reply_to: null },
        { in_reply_to: '' },
        { in_reply_to: { $exists: false } }
      ],
    }).limit(10);

    const trackedMessages = await this.meMessageModel.find({
      creator: new Types.ObjectId(userId),
      'metadata.tracking': { $exists: true },
    }).limit(10);

    const openedMessages = await this.meMessageModel.find({
      creator: new Types.ObjectId(userId),
      'metadata.tracking.isOpened': true,
    }).limit(10);

    const openedOriginalMessages = await this.meMessageModel.find({
      creator: new Types.ObjectId(userId),
      'metadata.tracking.isOpened': true,
      $or: [
        { in_reply_to: null },
        { in_reply_to: '' },
        { in_reply_to: { $exists: false } }
      ],
    }).limit(10);

    return {
      totalMessages: await this.meMessageModel.countDocuments({ creator: new Types.ObjectId(userId) }),
      totalSentMessages: await this.meMessageModel.countDocuments({
        creator: new Types.ObjectId(userId),
        sent_or_received: 'sent',
      }),
      totalOriginalSentMessages: await this.meMessageModel.countDocuments({
        creator: new Types.ObjectId(userId),
        sent_or_received: 'sent',
        $or: [
          { in_reply_to: null },
          { in_reply_to: '' },
          { in_reply_to: { $exists: false } }
        ],
      }),
      totalTrackedMessages: await this.meMessageModel.countDocuments({
        creator: new Types.ObjectId(userId),
        'metadata.tracking': { $exists: true },
      }),
      totalOpenedMessages: await this.meMessageModel.countDocuments({
        creator: new Types.ObjectId(userId),
        'metadata.tracking.isOpened': true,
      }),
      totalOpenedOriginalMessages: await this.meMessageModel.countDocuments({
        creator: new Types.ObjectId(userId),
        'metadata.tracking.isOpened': true,
        $or: [
          { in_reply_to: null },
          { in_reply_to: '' },
          { in_reply_to: { $exists: false } }
        ],
      }),
      sampleMessages: allMessages.map(m => ({
        id: m._id,
        sent_or_received: m.sent_or_received,
        createdAt: m.createdAt,
        metadata: m.metadata,
        isRead: m.isRead,
      })),
      sampleSentMessages: sentMessages.map(m => ({
        id: m._id,
        subject: m.subject,
        to: m.to,
        createdAt: m.createdAt,
        in_reply_to: m.in_reply_to,
      })),
      sampleOriginalSentMessages: originalSentMessages.map(m => ({
        id: m._id,
        subject: m.subject,
        to: m.to,
        createdAt: m.createdAt,
        in_reply_to: m.in_reply_to,
      })),
      sampleTrackedMessages: trackedMessages.map(m => ({
        id: m._id,
        tracking: m.metadata?.tracking,
        createdAt: m.createdAt,
      })),
      sampleOpenedMessages: openedMessages.map(m => ({
        id: m._id,
        tracking: m.metadata?.tracking,
        createdAt: m.createdAt,
        in_reply_to: m.in_reply_to,
      })),
      sampleOpenedOriginalMessages: openedOriginalMessages.map(m => ({
        id: m._id,
        tracking: m.metadata?.tracking,
        createdAt: m.createdAt,
        in_reply_to: m.in_reply_to,
      })),
    };
  }

  async getOpenRate(userId: string, query: OpenRateQueryDto): Promise<OpenRateResponseDto> {
    let startDate: Date;
    let endDate: Date;

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      const days = query.days || 7;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log('=== Debug Open Rate Query ===');
    console.log('User ID:', userId);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    const messages = await this.meMessageModel.find({
      creator: new Types.ObjectId(userId),
      sent_or_received: 'sent',
      $or: [
        { in_reply_to: null },
        { in_reply_to: '' },
        { in_reply_to: { $exists: false } }
      ],
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    console.log('Total messages found:', messages.length);

    // Group messages by sender
    const senderStatsMap = new Map<string, {
      messages: MEMessageDocument[];
      totalSent: number;
      totalOpened: number;
      totalOpenCount: number;
      dailyStats: Map<string, { sent: number; opened: number; openCount: number }>;
    }>();

    // Overall stats
    let totalSent = 0;
    let totalOpened = 0;
    let totalOpenCount = 0;
    const overallDailyStatsMap = new Map<string, { sent: number; opened: number; openCount: number }>();

    // Process each message
    messages.forEach((message) => {
      const sender = message.sender || 'unknown';
      const dateKey = message.createdAt.toISOString().split('T')[0];

      // Initialize sender stats if needed
      if (!senderStatsMap.has(sender)) {
        senderStatsMap.set(sender, {
          messages: [],
          totalSent: 0,
          totalOpened: 0,
          totalOpenCount: 0,
          dailyStats: new Map()
        });
      }

      const senderStats = senderStatsMap.get(sender)!;
      senderStats.messages.push(message);
      senderStats.totalSent++;
      totalSent++;

      // Initialize daily stats for this sender
      if (!senderStats.dailyStats.has(dateKey)) {
        senderStats.dailyStats.set(dateKey, { sent: 0, opened: 0, openCount: 0 });
      }
      const senderDayStats = senderStats.dailyStats.get(dateKey)!;
      senderDayStats.sent++;

      // Initialize overall daily stats
      if (!overallDailyStatsMap.has(dateKey)) {
        overallDailyStatsMap.set(dateKey, { sent: 0, opened: 0, openCount: 0 });
      }
      const overallDayStats = overallDailyStatsMap.get(dateKey)!;
      overallDayStats.sent++;

      // Check if message was opened
      const tracking = message.metadata?.tracking;
      if (tracking?.isOpened) {
        senderStats.totalOpened++;
        totalOpened++;
        senderDayStats.opened++;
        overallDayStats.opened++;

        const openCount = tracking.openCount || 1;
        senderStats.totalOpenCount += openCount;
        totalOpenCount += openCount;
        senderDayStats.openCount += openCount;
        overallDayStats.openCount += openCount;
      }
    });

    // Convert sender stats to response format
    const bySender: SenderStatsDto[] = Array.from(senderStatsMap.entries()).map(([sender, stats]) => {
      const openRate = stats.totalSent > 0 ? (stats.totalOpened / stats.totalSent) * 100 : 0;
      const avgOpensPerEmail = stats.totalOpened > 0 ? stats.totalOpenCount / stats.totalOpened : 0;

      const dailyStats = Array.from(stats.dailyStats.entries())
        .map(([date, dayStats]) => ({
          date,
          sent: dayStats.sent,
          opened: dayStats.opened,
          openRate: dayStats.sent > 0 ? (dayStats.opened / dayStats.sent) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        sender,
        totalSent: stats.totalSent,
        totalOpened: stats.totalOpened,
        totalOpenCount: stats.totalOpenCount,
        openRate: Math.round(openRate * 100) / 100,
        avgOpensPerEmail: Math.round(avgOpensPerEmail * 100) / 100,
        dailyStats
      };
    }).sort((a, b) => b.totalSent - a.totalSent); // Sort by total sent, descending

    // Calculate overall stats
    const overallOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const overallAvgOpensPerEmail = totalOpened > 0 ? totalOpenCount / totalOpened : 0;

    const overallDailyStats = Array.from(overallDailyStatsMap.entries())
      .map(([date, stats]) => ({
        date,
        sent: stats.sent,
        opened: stats.opened,
        openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log('Final stats:', { 
      totalSent, 
      totalOpened, 
      totalOpenCount,
      uniqueSenders: senderStatsMap.size
    });

    return {
      totalSent,
      totalOpened,
      totalOpenCount,
      openRate: Math.round(overallOpenRate * 100) / 100,
      avgOpensPerEmail: Math.round(overallAvgOpensPerEmail * 100) / 100,
      periodStart: startDate,
      periodEnd: endDate,
      bySender,
      dailyStats: overallDailyStats,
    };
  }
}