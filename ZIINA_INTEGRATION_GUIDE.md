# Ziina Payment Gateway Integration Guide

## Overview
This guide provides detailed implementation steps for integrating Ziina payment gateway with the subscription system.

## Ziina OAuth 2.0 Flow

### 1. Authorization Flow

```typescript
// 1. Generate authorization URL
const authUrl = `https://auth.ziina.com/oauth/authorize?` +
  `client_id=${ZIINA_CLIENT_ID}` +
  `&redirect_uri=${ZIINA_REDIRECT_URI}` +
  `&response_type=code` +
  `&scope=payments.create+payments.read+refunds.create`;

// 2. Handle callback
async handleOAuthCallback(code: string) {
  const tokenResponse = await axios.post('https://auth.ziina.com/oauth/token', {
    grant_type: 'authorization_code',
    client_id: ZIINA_CLIENT_ID,
    client_secret: ZIINA_CLIENT_SECRET,
    code: code,
    redirect_uri: ZIINA_REDIRECT_URI
  });
  
  // Store tokens securely
  await storeTokens({
    access_token: tokenResponse.data.access_token,
    refresh_token: tokenResponse.data.refresh_token,
    expires_in: tokenResponse.data.expires_in
  });
}
```

### 2. Token Management

```typescript
class ZiinaTokenManager {
  async getValidToken(): Promise<string> {
    const token = await this.getStoredToken();
    
    if (this.isTokenExpired(token)) {
      return await this.refreshToken(token.refresh_token);
    }
    
    return token.access_token;
  }
  
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await axios.post('https://auth.ziina.com/oauth/token', {
      grant_type: 'refresh_token',
      client_id: ZIINA_CLIENT_ID,
      client_secret: ZIINA_CLIENT_SECRET,
      refresh_token: refreshToken
    });
    
    await this.storeTokens(response.data);
    return response.data.access_token;
  }
}
```

## Payment Implementation Examples

### 1. Create Payment Intent

```typescript
async createPaymentIntent(
  amount: number,
  currency: string = 'USD',
  options: {
    message?: string;
    successUrl?: string;
    cancelUrl?: string;
    failureUrl?: string;
    test?: boolean;
  } = {}
): Promise<PaymentIntent> {
  const token = await this.tokenManager.getValidToken();
  
  const response = await axios.post(
    'https://api-v2.ziina.com/api/payment_intent',
    {
      amount: amount * 100, // Convert to cents
      currency_code: currency,
      message: options.message,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      failure_url: options.failureUrl,
      test: options.test || false,
      transaction_source: 'directApi',
      allow_tips: false
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}
```

### 2. Create Payment Link

```typescript
async createPaymentLink(
  invoiceId: string,
  amount: number,
  description: string
): Promise<PaymentIntent> {
  const token = await this.tokenManager.getValidToken();
  
  // Note: Ziina v2 uses payment_intent for payment links
  const response = await axios.post(
    'https://api-v2.ziina.com/api/payment_intent',
    {
      amount: amount * 100,
      currency_code: 'USD',
      message: description,
      success_url: `${APP_URL}/payments/success?invoice=${invoiceId}`,
      cancel_url: `${APP_URL}/payments/cancel?invoice=${invoiceId}`,
      failure_url: `${APP_URL}/payments/failure?invoice=${invoiceId}`,
      test: false,
      transaction_source: 'directApi'
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Use redirect_url for payment page
  return {
    ...response.data,
    url: response.data.redirect_url
  };
}
```

### 3. Process Refund

```typescript
async refundPayment(
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<Refund> {
  const token = await this.tokenManager.getValidToken();
  
  // Note: Ziina v2 refund API endpoint may differ
  const response = await axios.post(
    `https://api-v2.ziina.com/api/refunds`,
    {
      payment: paymentId,
      amount: amount ? amount * 100 : undefined, // Partial refund if amount specified
      reason: reason || 'requested_by_customer',
      metadata: {
        processed_at: new Date().toISOString()
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}
```

## Webhook Implementation

### 1. Webhook Handler

```typescript
@Controller('webhooks')
export class WebhookController {
  @Post('ziina')
  async handleZiinaWebhook(
    @Body() payload: any,
    @Headers('ziina-signature') signature: string
  ) {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    
    // Process webhook based on event type (v2 API)
    switch (payload.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(payload.data.object);
        break;
        
      case 'payment_intent.failed':
        await this.handlePaymentFailure(payload.data.object);
        break;
        
      case 'payment_intent.canceled':
        await this.handlePaymentCancellation(payload.data.object);
        break;
        
      case 'refund.succeeded':
        await this.handleRefund(payload.data.object);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${payload.type}`);
    }
    
    return { received: true };
  }
  
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', ZIINA_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
      
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
```

### 2. Payment Success Handler

```typescript
async handlePaymentSuccess(paymentIntent: any) {
  const { orderId, invoiceId } = paymentIntent.metadata;
  
  // Start transaction
  const session = await this.connection.startSession();
  session.startTransaction();
  
  try {
    // Update order status
    await this.orderService.updateOrderStatus(orderId, 'completed', session);
    
    // Mark invoice as paid
    await this.invoiceService.markInvoiceAsPaid(invoiceId, paymentIntent.id, session);
    
    // Create payment transaction record
    await this.paymentService.createTransaction({
      orderId,
      invoiceId,
      providerTransactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: 'succeeded',
      providerResponse: paymentIntent
    }, session);
    
    // Process order (activate subscription, add credits, etc.)
    await this.orderService.processOrder(orderId, session);
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

## Subscription Payment Flow

### 1. Initial Subscription

```typescript
async createSubscription(userId: string, planId: string) {
  // 1. Create order
  const order = await this.orderService.create({
    userId,
    type: 'subscription',
    items: [{
      type: 'plan',
      referenceId: planId,
      quantity: 1,
      unitPrice: plan.price,
      totalPrice: plan.price,
      description: `${plan.name} Subscription`
    }]
  });
  
  // 2. Create invoice
  const invoice = await this.invoiceService.create({
    orderId: order._id,
    userId,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  // 3. Create payment intent (v2 API)
  const paymentIntent = await this.ziinaService.createPaymentIntent(
    order.total,
    'USD',
    {
      message: `Subscription to ${plan.name}`,
      successUrl: `${APP_URL}/payments/success?invoice=${invoice._id}`,
      cancelUrl: `${APP_URL}/payments/cancel?invoice=${invoice._id}`,
      failureUrl: `${APP_URL}/payments/failure?invoice=${invoice._id}`
    }
  );
  
  // 4. Update invoice with payment URL
  await this.invoiceService.update(invoice._id, {
    paymentUrl: paymentIntent.redirect_url
  });
  
  return {
    order,
    invoice,
    paymentUrl: paymentIntent.redirect_url
  };
}
```

### 2. Recurring Billing

```typescript
@Cron('0 0 * * *') // Run daily at midnight
async processRecurringBilling() {
  const subscriptionsDue = await this.subscriptionService.getSubscriptionsDueForRenewal();
  
  for (const subscription of subscriptionsDue) {
    try {
      // Create renewal order
      const order = await this.orderService.createRenewalOrder(subscription);
      
      // Create invoice
      const invoice = await this.invoiceService.createRecurringInvoice(subscription, order);
      
      // Attempt automatic payment if payment method saved
      if (subscription.paymentMethod) {
        await this.processAutomaticPayment(subscription, order, invoice);
      } else {
        // Send invoice with payment link
        await this.sendRenewalInvoice(subscription, invoice);
      }
    } catch (error) {
      console.error(`Failed to process renewal for subscription ${subscription._id}`, error);
      await this.handleRenewalFailure(subscription, error);
    }
  }
}
```

### 3. Credit Recharge

```typescript
async purchaseCredits(userId: string, packageId: string) {
  const creditPackage = await this.creditPackageService.findById(packageId);
  
  // Create order
  const order = await this.orderService.create({
    userId,
    type: 'credit_recharge',
    items: [{
      type: 'credits',
      referenceId: packageId,
      quantity: 1,
      unitPrice: creditPackage.price,
      totalPrice: creditPackage.price,
      description: `${creditPackage.credits} Credits`
    }]
  });
  
  // Create payment intent (v2 API)
  const paymentIntent = await this.ziinaService.createPaymentIntent(
    order.total,
    'USD',
    {
      message: `Purchase ${creditPackage.credits} Credits`,
      successUrl: `${APP_URL}/payments/success?order=${order._id}`,
      cancelUrl: `${APP_URL}/payments/cancel?order=${order._id}`,
      failureUrl: `${APP_URL}/payments/failure?order=${order._id}`
    }
  );
  
  return {
    order,
    paymentIntent,
    paymentUrl: paymentIntent.redirect_url
  };
}
```

## Error Handling

### 1. Payment Failures

```typescript
async handlePaymentFailure(paymentIntent: any) {
  const { orderId, subscriptionId } = paymentIntent.metadata;
  
  // Update order status
  await this.orderService.updateOrderStatus(orderId, 'failed');
  
  // Handle subscription payment failure
  if (subscriptionId) {
    const subscription = await this.subscriptionService.findById(subscriptionId);
    
    // Check if within grace period
    if (this.isWithinGracePeriod(subscription)) {
      // Send retry notification
      await this.notificationService.sendPaymentRetryNotification(subscription);
    } else {
      // Suspend subscription
      await this.subscriptionService.suspendSubscription(subscriptionId);
    }
  }
}
```

### 2. Webhook Retry Logic

```typescript
class WebhookProcessor {
  async processWebhook(event: any): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        await this.handleWebhookEvent(event);
        break;
      } catch (error) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          // Log to dead letter queue
          await this.deadLetterQueue.add(event);
          throw error;
        }
        
        // Exponential backoff
        await this.sleep(Math.pow(2, retryCount) * 1000);
      }
    }
  }
}
```

## Testing with Ziina

### 1. Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
```

### 2. Test Webhook Events
```bash
# Send test webhook (v2 API format)
curl -X POST http://localhost:3000/webhooks/ziina \
  -H "Content-Type: application/json" \
  -H "ziina-signature: test_signature" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "amount": 10000,
        "currency_code": "USD",
        "status": "completed",
        "redirect_url": "https://pay.ziina.com/...",
        "metadata": {
          "orderId": "order_123",
          "invoiceId": "inv_123"
        }
      }
    }
  }'
```

## Security Best Practices

1. **API Key Storage**: Never commit API keys. Use environment variables
2. **Webhook Validation**: Always verify webhook signatures
3. **Idempotency**: Implement idempotency keys for payment operations
4. **PCI Compliance**: Never store card details directly
5. **Rate Limiting**: Implement rate limiting on payment endpoints
6. **Audit Logging**: Log all payment-related operations

## Monitoring & Alerts

1. **Payment Success Rate**: Monitor percentage of successful payments
2. **Failed Payments**: Alert on payment failures
3. **Webhook Failures**: Monitor webhook processing failures
4. **API Errors**: Track Ziina API errors and timeouts
5. **Fraud Detection**: Monitor for suspicious payment patterns

This guide provides the technical foundation for implementing Ziina payment gateway integration with your subscription system.