# Ziina Payment Gateway Setup Guide

## Prerequisites

1. Ziina merchant account
2. API credentials from Ziina dashboard

## Configuration Steps

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Ziina API Configuration
ZIINA_API_URL=https://api-sandbox-v2.ziina.com/api  # Use sandbox for testing
ZIINA_ACCESS_TOKEN=your_ziina_access_token_here
ZIINA_WEBHOOK_SECRET=your_webhook_secret_here
```

For production, use:
```bash
ZIINA_API_URL=https://api-v2.ziina.com/api
```

### 2. Getting API Credentials

1. Log in to your Ziina merchant dashboard
2. Navigate to Settings > API Keys
3. Generate a new API key (access token)
4. Copy the access token to `ZIINA_ACCESS_TOKEN`

### 3. Webhook Configuration

1. In Ziina dashboard, go to Settings > Webhooks
2. Add a new webhook endpoint:
   - URL: `https://your-domain.com/webhooks/ziina`
   - Events: Select all payment-related events
3. Copy the webhook secret to `ZIINA_WEBHOOK_SECRET`

### 4. Testing the Integration

1. Create a test subscription:
```bash
curl -X POST http://localhost:3041/api/en/subscription/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "YOUR_PLAN_ID"
  }'
```

2. Use the returned order ID to create a payment:
```bash
curl -X POST http://localhost:3041/api/en/payment/checkout/ORDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. The response will include a `paymentUrl` - redirect the user to this URL to complete payment.

## Error Handling

If you receive a 500 error, check:

1. **Missing Configuration**: Ensure all Ziina environment variables are set
2. **Invalid Token**: Verify your access token is valid and not expired
3. **Network Issues**: Check if you can reach Ziina API from your server
4. **Order Issues**: Verify the order exists and belongs to the authenticated user

## Common Issues

### "Payment gateway not configured"
This error means the Ziina environment variables are not set. Check your `.env` file.

### "Invalid order ID format"
The order ID must be a valid MongoDB ObjectId (24 character hex string).

### "Order already paid"
The order has already been paid and cannot be paid again.

## Production Checklist

- [ ] Use production Ziina API URL
- [ ] Use production access token
- [ ] Configure production webhook URL
- [ ] Test webhook signature verification
- [ ] Enable HTTPS for webhook endpoint
- [ ] Set up error monitoring
- [ ] Configure payment success/failure redirect URLs