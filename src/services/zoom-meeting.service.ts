import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as base64 from 'base-64';
import { DateTime } from 'luxon';

@Injectable()
export class ZoomMeetingService {
  private readonly zoomAuthUrl = 'https://zoom.us/oauth/token';
  private readonly zoomApiUrl = 'https://api.zoom.us/v2';

  private readonly accountId = process.env.ZOOM_ACCOUNT_ID;
  private readonly clientId = process.env.ZOOM_CLIENT_ID;
  private readonly clientSecret = process.env.ZOOM_CLIENT_SECRET;

  private accessToken: string = null; // optional caching

  constructor() {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const authHeader = base64.encode(`${this.clientId}:${this.clientSecret}`);
    const url = `${this.zoomAuthUrl}?grant_type=account_credentials&account_id=${this.accountId}`;

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error fetching Zoom token:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to fetch Zoom Access Token');
    }
  }

  async createMeeting(meetingData: {
    topic: string;
    type?: number;
    agenda?: string;
    start_time: string;
    duration?: number;
    timezone?: string;
    settings?: any;
  }): Promise<any> {
    const accessToken = await this.getAccessToken();

    const payload = {
      topic: meetingData.topic,
      type: meetingData.type || 2,
      start_time: meetingData.start_time,
      duration: meetingData.duration || 60,
      timezone: meetingData.timezone || 'Asia/Riyadh',
      agenda: meetingData.agenda || '',
      settings: meetingData.settings || {
        host_video: true,
        participant_video: false,
        waiting_room: false,
        approval_type: 2,
      },
    };

    try {
      const response = await axios.post(
        `${this.zoomApiUrl}/users/me/meetings`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Zoom API Error:', error.response?.status, error.response?.data?.message || error.message);
      throw new BadRequestException(error.response?.data?.message || 'Failed to create Zoom meeting');
    }
  }

  async updateMeeting(meetingId: string, updateData: Partial<{
    topic: string;
    agenda: string;
    start_time: string;
    duration: number;
    timezone: string;
    settings: any;
  }>): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.patch(
        `${this.zoomApiUrl}/meetings/${meetingId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Meeting updated successfully!');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating meeting:', error.response?.data || error.message);
      throw new BadRequestException('Failed to update Zoom meeting');
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    try {
      await axios.delete(
        `${this.zoomApiUrl}/meetings/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Meeting deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting meeting:', error.response?.data || error.message);
      throw new BadRequestException('Failed to delete Zoom meeting');
    }
  }

  async getMeeting(meetingId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.zoomApiUrl}/meetings/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Meeting fetched successfully!');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching meeting:', error.response?.data || error.message);
      throw new BadRequestException('Failed to fetch Zoom meeting');
    }
  }
}




export function buildZoomStartTime(input: {
  date: string;       
  startTime: string;    
  timeZone: string;     
}): string {
  const timezoneMap = {
    CAI: 'Africa/Cairo',
  };

  const localTime = DateTime.fromFormat(
    `${input.date} ${input.startTime}`,
    'yyyy-MM-dd HH:mm',
    { zone: timezoneMap[input.timeZone] }
  );

  if (!localTime.isValid) {
    throw new Error('Invalid date or time provided');
  }

  // Very important: drop milliseconds
  const utcTime = localTime.toUTC().startOf('minute');

  return utcTime.toISO({ suppressMilliseconds: true }); 
}

