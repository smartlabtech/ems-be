# Facebook Pixel Backend Integration Guide - NestJS

## Overview
This guide explains how to implement server-side Facebook Pixel tracking using the Conversions API (CAPI) in a NestJS application.

## Which Approach to Choose?

### Direct HTTP API (Recommended)
✅ **Pros:**
- Lightweight - no SDK dependencies
- Simple and easy to debug
- Full control over requests
- Smaller bundle size
- No breaking changes from SDK updates

❌ **Cons:**
- Need to manually construct payloads
- Handle API versioning yourself

### Facebook SDK
✅ **Pros:**
- Type-safe interfaces
- Automatic retry logic
- Built-in validation

❌ **Cons:**
- Heavy dependency
- Potential breaking changes
- More complex setup
- Harder to debug

**Recommendation:** Use Direct HTTP API for production applications.

## Frontend Data Collection

The frontend sends the following data with the signup request in the `fbPixelData` object:

```typescript
interface FbPixelData {
  fbp: string;        // Facebook browser ID (_fbp cookie)
  fbc: string;        // Facebook click ID (_fbc cookie)
  ip: string;         // User IP address
  userAgent: string;  // Browser user agent
  country: string;    // Country code
  city: string;       // City name
  region: string;     // State/region
  currency: string;   // Currency code (USD)
  language: string;   // Language (en-US)
  referrer: string;   // Referrer URL
  landingPage: string;// Landing page URL
  utmSource?: string; // UTM source
  utmMedium?: string; // UTM medium
  utmCampaign?: string;// UTM campaign
  utmContent?: string; // UTM content
  utmTerm?: string;    // UTM term
}
```

## NestJS Implementation

You have two approaches to implement Facebook Pixel server-side tracking:

### Approach 1: Direct HTTP API (Recommended - Simpler & Lighter)

No SDK needed, just axios for HTTP requests.

```bash
npm install axios
npm install @nestjs/config # For environment variables
```

### Approach 2: Facebook Business SDK

```bash
npm install facebook-nodejs-business-sdk
npm install @nestjs/config # For environment variables
```

### 2. Create FB Pixel Module

```typescript
// src/fb-pixel/fb-pixel.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FbPixelService } from './fb-pixel.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [FbPixelService],
  exports: [FbPixelService],
})
export class FbPixelModule {}
```

### 3. Create FB Pixel Service

#### Option A: Direct HTTP API Implementation (Recommended)

```typescript
// src/fb-pixel/fb-pixel.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class FbPixelService {
  private readonly logger = new Logger(FbPixelService.name);
  private readonly pixelId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string = 'v18.0';
  private readonly testEventCode?: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.pixelId = this.configService.get<string>('FB_PIXEL_ID');
    this.accessToken = this.configService.get<string>('FB_ACCESS_TOKEN');
    this.testEventCode = this.configService.get<string>('FB_TEST_EVENT_CODE');
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;
  }

  /**
   * Hash string using SHA-256
   */
  private hashString(data: string): string {
    if (!data) return null;
    return crypto
      .createHash('sha256')
      .update(data.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Send event using HTTP API directly
   */
  async sendEvent(
    eventName: string,
    userData: any,
    customData: any = {},
    eventSourceUrl?: string,
  ): Promise<any> {
    try {
      const payload = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'system',
        event_source_url: eventSourceUrl || 'https://www.brandbanda.com',
        event_id: crypto.randomUUID(), // Prevent duplicates
        user_data: {
          em: userData.email ? [this.hashString(userData.email)] : undefined,
          ph: userData.phone ? [this.hashString(userData.phone)] : undefined,
          fn: userData.firstName ? [this.hashString(userData.firstName)] : undefined,
          ln: userData.lastName ? [this.hashString(userData.lastName)] : undefined,
          country: userData.country ? [this.hashString(userData.country)] : undefined,
          ct: userData.city ? [this.hashString(userData.city)] : undefined,
          client_user_agent: userData.userAgent,
          client_ip_address: userData.ipAddress,
          fbc: userData.fbc,
          fbp: userData.fbp,
        },
        custom_data: customData,
      };

      // Remove undefined values
      Object.keys(payload.user_data).forEach(key => {
        if (payload.user_data[key] === undefined) {
          delete payload.user_data[key];
        }
      });

      const requestData: any = {
        data: [payload],
        access_token: this.accessToken,
      };

      if (this.testEventCode) {
        requestData.test_event_code = this.testEventCode;
      }

      const response = await axios.post(this.apiUrl, requestData);
      this.logger.log(`FB Pixel Event Sent: ${eventName}`);
      return response.data;

    } catch (error) {
      this.logger.error(`FB Pixel Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Batch process multiple events
   */
  async sendBatchEvents(events: any[]): Promise<any> {
    try {
      const payloads = events.map(event => ({
        event_name: event.eventName,
        event_time: Math.floor(new Date(event.eventTime).getTime() / 1000),
        action_source: 'system',
        event_source_url: event.sourceUrl || 'https://www.brandbanda.com',
        event_id: event.eventId || crypto.randomUUID(),
        user_data: {
          em: event.email ? [this.hashString(event.email)] : undefined,
          ph: event.phone ? [this.hashString(event.phone)] : undefined,
          country: event.country ? [this.hashString(event.country)] : undefined,
          client_user_agent: event.userAgent,
          client_ip_address: event.ipAddress,
          fbc: event.fbc,
          fbp: event.fbp,
        },
        custom_data: event.customData || {},
      }));

      const requestData: any = {
        data: payloads,
        access_token: this.accessToken,
      };

      if (this.testEventCode) {
        requestData.test_event_code = this.testEventCode;
      }

      const response = await axios.post(this.apiUrl, requestData);
      this.logger.log(`FB Pixel Batch Sent: ${events.length} events`);
      return response.data;

    } catch (error) {
      this.logger.error(`FB Pixel Batch Error: ${error.message}`);
      return null;
    }
  }
}
```

#### Option B: Facebook SDK Implementation

```typescript
// src/fb-pixel/fb-pixel.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
const bizSdk = require('facebook-nodejs-business-sdk');

@Injectable()
export class FbPixelService {
  private readonly logger = new Logger(FbPixelService.name);
  private readonly accessToken: string;
  private readonly pixelId: string;
  private readonly testEventCode?: string;

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('FB_ACCESS_TOKEN');
    this.pixelId = this.configService.get<string>('FB_PIXEL_ID');
    this.testEventCode = this.configService.get<string>('FB_TEST_EVENT_CODE');

    if (this.accessToken && this.pixelId) {
      bizSdk.FacebookAdsApi.init(this.accessToken);
      this.logger.log('Facebook Pixel Service initialized');

      // Enable debug mode in development
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        bizSdk.FacebookAdsApi.setDebugMode(true);
      }
    } else {
      this.logger.warn('Facebook Pixel credentials not configured');
    }
  }

  /**
   * Hash sensitive data using SHA-256
   */
  private hashData(data: string): string {
    if (!data) return null;
    return crypto
      .createHash('sha256')
      .update(data.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Send event to Facebook Conversions API
   */
  async sendEvent(
    eventName: string,
    userData: any,
    customData: any,
    eventSourceUrl: string,
  ): Promise<any> {
    if (!this.accessToken || !this.pixelId) {
      this.logger.warn('FB Pixel not configured, skipping event:', eventName);
      return null;
    }

    try {
      const ServerEvent = bizSdk.ServerEvent;
      const UserData = bizSdk.UserData;
      const CustomData = bizSdk.CustomData;
      const EventRequest = bizSdk.EventRequest;

      // Create user data object with hashed PII
      const user = new UserData()
        .setEmails(userData.email ? [this.hashData(userData.email)] : [])
        .setFirstName(userData.firstName ? this.hashData(userData.firstName) : null)
        .setLastName(userData.lastName ? this.hashData(userData.lastName) : null)
        .setPhone(userData.phone ? this.hashData(userData.phone.replace(/\D/g, '')) : null)
        .setClientIpAddress(userData.ip)
        .setClientUserAgent(userData.userAgent)
        .setFbp(userData.fbp)
        .setFbc(userData.fbc)
        .setCountry(userData.country ? this.hashData(userData.country) : null)
        .setState(userData.region ? this.hashData(userData.region) : null)
        .setCity(userData.city ? this.hashData(userData.city) : null)
        .setZipCode(userData.zip ? this.hashData(userData.zip) : null);

      // Create custom data object
      const custom = new CustomData()
        .setCurrency(customData.currency || 'USD')
        .setValue(customData.value || 0)
        .setContentName(customData.contentName)
        .setContentIds(customData.contentIds || [])
        .setContentType(customData.contentType || 'product')
        .setContentCategory(customData.contentCategory)
        .setNumItems(customData.numItems || 1)
        .setCustomProperties(customData.custom || {});

      // Create server event
      const serverEvent = new ServerEvent()
        .setEventName(eventName)
        .setEventTime(Math.floor(Date.now() / 1000))
        .setUserData(user)
        .setCustomData(custom)
        .setEventSourceUrl(eventSourceUrl)
        .setActionSource('system')
        .setEventId(crypto.randomUUID()); // For deduplication

      // Create and execute event request
      const eventsData = [serverEvent];
      const eventRequest = new EventRequest(this.accessToken, this.pixelId)
        .setEvents(eventsData);

      // Add test event code if provided (for testing in Events Manager)
      if (this.testEventCode) {
        eventRequest.setTestEventCode(this.testEventCode);
      }

      // Send the event
      const response = await eventRequest.execute();

      this.logger.log(`FB Pixel Event Sent: ${eventName}`, {
        eventId: serverEvent.event_id,
        response: response,
      });

      return response;
    } catch (error) {
      this.logger.error(`FB Pixel Error for event ${eventName}:`, error);
      // Don't throw - we don't want FB Pixel errors to break the main flow
      return null;
    }
  }

  /**
   * Track Lead event
   */
  async trackLead(userData: any, planData: any): Promise<void> {
    await this.sendEvent(
      'Lead',
      userData,
      {
        value: planData.price || 0,
        currency: userData.currency || 'USD',
        contentName: `Lead - ${planData.name}`,
        contentIds: [planData._id],
        custom: {
          planId: planData._id,
          planName: planData.name,
        },
      },
      userData.landingPage || userData.referrer,
    );
  }

  /**
   * Track Complete Registration event
   */
  async trackCompleteRegistration(
    userData: any,
    planData: any,
    userId?: string,
  ): Promise<void> {
    await this.sendEvent(
      'CompleteRegistration',
      userData,
      {
        value: planData.price || 0,
        currency: userData.currency || 'USD',
        contentName: planData.name,
        contentIds: [planData._id],
        status: 'Completed',
        custom: {
          planId: planData._id,
          credits: planData.credits,
          userId: userId,
          registrationMethod: 'Website',
        },
      },
      userData.landingPage || userData.referrer,
    );
  }

  /**
   * Track Initiate Checkout event
   */
  async trackInitiateCheckout(
    userData: any,
    orderData: any,
  ): Promise<void> {
    await this.sendEvent(
      'InitiateCheckout',
      userData,
      {
        value: orderData.total,
        currency: orderData.currency || 'USD',
        contentIds: orderData.planId ? [orderData.planId] : [],
        contentType: 'subscription',
        numItems: 1,
        custom: {
          orderId: orderData._id,
        },
      },
      userData.landingPage || userData.referrer,
    );
  }

  /**
   * Track Purchase event
   */
  async trackPurchase(userData: any, orderData: any): Promise<void> {
    await this.sendEvent(
      'Purchase',
      userData,
      {
        value: orderData.total,
        currency: orderData.currency || 'USD',
        contentIds: orderData.planId ? [orderData.planId] : [],
        contentName: orderData.description,
        contentType: 'subscription',
        numItems: 1,
        custom: {
          orderId: orderData._id,
          paymentMethod: orderData.paymentMethod,
          subscriptionId: orderData.subscriptionId,
        },
      },
      userData.landingPage || userData.referrer,
    );
  }

  /**
   * Track ViewContent event
   */
  async trackViewContent(userData: any, contentData: any): Promise<void> {
    await this.sendEvent(
      'ViewContent',
      userData,
      {
        value: contentData.value || 0,
        currency: userData.currency || 'USD',
        contentName: contentData.name,
        contentIds: contentData.ids || [],
        contentType: contentData.type || 'product',
        contentCategory: contentData.category,
      },
      userData.currentPage || userData.landingPage,
    );
  }

  /**
   * Track Search event
   */
  async trackSearch(userData: any, searchData: any): Promise<void> {
    await this.sendEvent(
      'Search',
      userData,
      {
        searchString: searchData.query,
        contentCategory: searchData.category,
        custom: {
          resultsCount: searchData.resultsCount,
        },
      },
      userData.currentPage || userData.landingPage,
    );
  }

  /**
   * Track AddToCart event
   */
  async trackAddToCart(userData: any, cartData: any): Promise<void> {
    await this.sendEvent(
      'AddToCart',
      userData,
      {
        value: cartData.value,
        currency: cartData.currency || 'USD',
        contentName: cartData.name,
        contentIds: [cartData.id],
        contentType: 'subscription',
      },
      userData.currentPage || userData.landingPage,
    );
  }

  /**
   * Track Subscribe event
   */
  async trackSubscribe(userData: any, subscriptionData: any): Promise<void> {
    await this.sendEvent(
      'Subscribe',
      userData,
      {
        value: subscriptionData.value,
        currency: subscriptionData.currency || 'USD',
        predictedLTV: subscriptionData.value * 12, // Predicted lifetime value
        custom: {
          subscriptionId: subscriptionData._id,
          planName: subscriptionData.planName,
          billingCycle: subscriptionData.billingCycle || 'monthly',
        },
      },
      userData.landingPage || userData.referrer,
    );
  }

  /**
   * Track custom events
   */
  async trackCustomEvent(
    eventName: string,
    userData: any,
    customData: any,
  ): Promise<void> {
    await this.sendEvent(
      eventName,
      userData,
      customData,
      userData.currentPage || userData.landingPage,
    );
  }
}
```

### 4. Create DTOs

```typescript
// src/fb-pixel/dto/fb-pixel.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class FbPixelDataDto {
  @IsOptional()
  @IsString()
  fbp?: string;

  @IsOptional()
  @IsString()
  fbc?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  landingPage?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  utmContent?: string;

  @IsOptional()
  @IsString()
  utmTerm?: string;
}
```

### 5. Update Auth Module

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { FbPixelModule } from '../fb-pixel/fb-pixel.module';

@Module({
  imports: [
    UsersModule,
    FbPixelModule, // Import FB Pixel module
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

### 6. Update Auth Service

```typescript
// src/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { FbPixelService } from '../fb-pixel/fb-pixel.service';
import { SignupWithPlanDto } from './dto/signup-with-plan.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private fbPixelService: FbPixelService,
  ) {}

  async signupWithPlan(signupDto: SignupWithPlanDto) {
    const {
      firstName,
      lastName,
      email,
      password,
      planId,
      fbPixelData,
    } = signupDto;

    // Get plan details
    const plan = await this.plansService.findOne(planId);

    // Track Lead event when signup starts
    if (fbPixelData) {
      await this.fbPixelService.trackLead(
        {
          email,
          firstName,
          lastName,
          ip: fbPixelData.ip,
          userAgent: fbPixelData.userAgent,
          fbp: fbPixelData.fbp,
          fbc: fbPixelData.fbc,
          country: fbPixelData.country,
          city: fbPixelData.city,
          region: fbPixelData.region,
          currency: fbPixelData.currency,
          landingPage: fbPixelData.landingPage,
          referrer: fbPixelData.referrer,
        },
        plan,
      );
    }

    try {
      // Create user
      const user = await this.usersService.create({
        firstName,
        lastName,
        email,
        password,
        // Store FB tracking data with user
        tracking: {
          fbp: fbPixelData?.fbp,
          fbc: fbPixelData?.fbc,
          utm: {
            source: fbPixelData?.utmSource,
            medium: fbPixelData?.utmMedium,
            campaign: fbPixelData?.utmCampaign,
            content: fbPixelData?.utmContent,
            term: fbPixelData?.utmTerm,
          },
          referrer: fbPixelData?.referrer,
          landingPage: fbPixelData?.landingPage,
          signupIp: fbPixelData?.ip,
          signupCountry: fbPixelData?.country,
        },
      });

      // Track Complete Registration event
      if (fbPixelData) {
        await this.fbPixelService.trackCompleteRegistration(
          {
            email,
            firstName,
            lastName,
            ip: fbPixelData.ip,
            userAgent: fbPixelData.userAgent,
            fbp: fbPixelData.fbp,
            fbc: fbPixelData.fbc,
            country: fbPixelData.country,
            city: fbPixelData.city,
            region: fbPixelData.region,
            currency: fbPixelData.currency,
            landingPage: fbPixelData.landingPage,
            referrer: fbPixelData.referrer,
          },
          plan,
          user._id.toString(),
        );
      }

      let orderId = null;

      // If paid plan, create order and track checkout
      if (plan.price > 0) {
        const order = await this.ordersService.create({
          userId: user._id,
          planId: plan._id,
          total: plan.price,
          currency: fbPixelData?.currency || 'USD',
        });

        orderId = order._id;

        // Track Initiate Checkout
        if (fbPixelData) {
          await this.fbPixelService.trackInitiateCheckout(
            {
              email,
              firstName,
              lastName,
              ip: fbPixelData.ip,
              userAgent: fbPixelData.userAgent,
              fbp: fbPixelData.fbp,
              fbc: fbPixelData.fbc,
              country: fbPixelData.country,
              city: fbPixelData.city,
              region: fbPixelData.region,
              currency: fbPixelData.currency,
              landingPage: fbPixelData.landingPage,
              referrer: fbPixelData.referrer,
            },
            order,
          );

          // Track custom event for paid signup
          await this.fbPixelService.trackCustomEvent(
            'PaidSignup',
            {
              email,
              firstName,
              lastName,
              ip: fbPixelData.ip,
              userAgent: fbPixelData.userAgent,
              fbp: fbPixelData.fbp,
              fbc: fbPixelData.fbc,
              landingPage: fbPixelData.landingPage,
            },
            {
              planName: plan.name,
              planPrice: plan.price,
              orderId: order._id,
              credits: plan.credits,
            },
          );
        }
      } else {
        // Track custom event for free signup
        if (fbPixelData) {
          await this.fbPixelService.trackCustomEvent(
            'FreeSignup',
            {
              email,
              firstName,
              lastName,
              ip: fbPixelData.ip,
              userAgent: fbPixelData.userAgent,
              fbp: fbPixelData.fbp,
              fbc: fbPixelData.fbc,
              landingPage: fbPixelData.landingPage,
            },
            {
              planName: plan.name,
              credits: plan.credits,
            },
          );
        }
      }

      return {
        success: true,
        user,
        orderId,
        message: 'Signup successful',
      };
    } catch (error) {
      this.logger.error('Signup error:', error);
      throw error;
    }
  }
}
```

### 7. Create Interceptor for Auto-Tracking

```typescript
// src/fb-pixel/fb-pixel.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FbPixelService } from './fb-pixel.service';

@Injectable()
export class FbPixelInterceptor implements NestInterceptor {
  constructor(private fbPixelService: FbPixelService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(async (data) => {
        // Auto-track page views for authenticated users
        if (user && user.tracking?.fbp) {
          const userData = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            fbp: user.tracking.fbp,
            fbc: user.tracking.fbc,
            currentPage: request.headers.referer,
            landingPage: user.tracking.landingPage,
          };

          // Track based on endpoint
          const url = request.url;

          if (url.includes('/products') && request.method === 'GET') {
            await this.fbPixelService.trackViewContent(userData, {
              name: 'Product View',
              category: 'Products',
            });
          }

          if (url.includes('/search') && request.method === 'GET') {
            await this.fbPixelService.trackSearch(userData, {
              query: request.query.q,
              resultsCount: data?.length || 0,
            });
          }
        }
      }),
    );
  }
}
```

### 8. Payment Success Handler

```typescript
// src/payments/payments.service.ts
import { Injectable } from '@nestjs/common';
import { FbPixelService } from '../fb-pixel/fb-pixel.service';

@Injectable()
export class PaymentsService {
  constructor(
    private fbPixelService: FbPixelService,
  ) {}

  async handlePaymentSuccess(orderId: string) {
    const order = await this.ordersService.findOne(orderId);
    const user = await this.usersService.findOne(order.userId);

    // Track Purchase event
    if (user.tracking?.fbp) {
      await this.fbPixelService.trackPurchase(
        {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fbp: user.tracking.fbp,
          fbc: user.tracking.fbc,
          country: user.tracking.signupCountry,
          landingPage: user.tracking.landingPage,
          referrer: user.tracking.referrer,
        },
        {
          _id: order._id,
          total: order.total,
          currency: order.currency,
          description: order.description,
          planId: order.planId,
          paymentMethod: order.paymentMethod,
        },
      );

      // Track Subscribe event for subscription
      if (order.subscriptionId) {
        await this.fbPixelService.trackSubscribe(
          {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fbp: user.tracking.fbp,
            fbc: user.tracking.fbc,
            landingPage: user.tracking.landingPage,
          },
          {
            _id: order.subscriptionId,
            value: order.total,
            currency: order.currency,
            planName: order.planName,
            billingCycle: order.billingCycle,
          },
        );
      }
    }

    // Update order status
    return this.ordersService.updateStatus(orderId, 'completed');
  }
}
```

### 9. Environment Configuration

```bash
# .env
FB_PIXEL_ID=1157426736438863
FB_ACCESS_TOKEN=your_access_token_here
FB_TEST_EVENT_CODE=TEST12345  # Optional, remove in production
```

### 10. App Module Setup

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FbPixelModule } from './fb-pixel/fb-pixel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FbPixelModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Testing

### 1. Enable Test Mode

```typescript
// For testing, add test event code to .env
FB_TEST_EVENT_CODE=TEST12345
```

### 2. Create Test Endpoint

```typescript
// src/fb-pixel/fb-pixel.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { FbPixelService } from './fb-pixel.service';

@Controller('fb-pixel')
export class FbPixelController {
  constructor(private fbPixelService: FbPixelService) {}

  @Post('test')
  async testEvent(@Body() body: any) {
    // Only enable in development
    if (process.env.NODE_ENV !== 'development') {
      return { error: 'Test endpoint disabled in production' };
    }

    await this.fbPixelService.trackCustomEvent(
      'TestEvent',
      {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
      },
      {
        test: true,
        timestamp: new Date().toISOString(),
      },
    );

    return { success: true, message: 'Test event sent' };
  }
}
```

### 3. Verify in Facebook Events Manager

1. Go to Events Manager
2. Select your pixel
3. Click "Test Events"
4. You should see events with your test code

## Best Practices

### 1. Error Handling
- Never let FB Pixel errors break main application flow
- Log errors but continue execution
- Use try-catch in service methods

### 2. Data Privacy
- Always hash PII before sending
- Store user consent preferences
- Implement opt-out mechanism

### 3. Performance
- Use async/await but don't block main flow
- Consider queue for high-volume events
- Batch events when possible

### 4. Monitoring

```typescript
// Create a monitoring service
@Injectable()
export class FbPixelMonitorService {
  async getEventStats(startDate: Date, endDate: Date) {
    // Query your event logs
    return this.eventLogsRepository.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$eventName',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
        },
      },
    ]);
  }
}
```

## Debugging

### Common Issues:

1. **Events not showing in Events Manager**
   - Check access token is valid
   - Verify pixel ID is correct
   - Ensure test event code is set (for testing)

2. **Low event match quality**
   - Include more user data fields
   - Ensure data is properly hashed
   - Check data format (lowercase, trimmed)

3. **Duplicate events**
   - Use event_id for deduplication
   - Check not sending from both client and server with same ID

### Debug Logging:

```typescript
// Enable detailed logging in development
if (process.env.NODE_ENV === 'development') {
  bizSdk.FacebookAdsApi.setDebugMode(true);
  this.logger.debug('FB Pixel Debug Mode Enabled');
}
```

## Production Checklist

- [ ] Remove test event code from .env
- [ ] Secure access token in environment variables
- [ ] Implement rate limiting for API endpoints
- [ ] Add monitoring and alerting
- [ ] Test all event types
- [ ] Verify data hashing works correctly
- [ ] Check GDPR/CCPA compliance
- [ ] Document user consent flow
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Create admin dashboard for event monitoring