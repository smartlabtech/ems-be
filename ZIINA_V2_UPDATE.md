# Ziina API v2 Update Summary

## Changes Made

### 1. Updated Base URL
- **Old**: `https://api.ziina.com/v1`
- **New**: `https://api-v2.ziina.com/api`

### 2. Updated Payment Intent Interface
The payment intent response now includes additional fields:
- `account_id`: Account receiving payment
- `tip_amount`: Tips amount
- `fee_amount`: Transaction fees
- `currency_code` (instead of `currency`)
- `status` with more specific values
- `operation_id`: Unique operation identifier
- `redirect_url`: URL for hosted payment page
- `latest_error` object with message and code
- `allow_tips` boolean flag

### 3. Updated Create Payment Intent Method
```typescript
// Old signature
createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>)

// New signature  
createPaymentIntent(
  amount: number,
  currency: string = 'USD',
  options: {
    message?: string;
    successUrl?: string;
    cancelUrl?: string;
    failureUrl?: string;
    test?: boolean;
    expiry?: string;
    allowTips?: boolean;
  } = {}
)
```

### 4. New Request Structure
- Changed `currency` to `currency_code`
- Added `test` flag for test payments
- Added `transaction_source` (set to 'directApi')
- Added `failure_url` for failed payment redirects
- Added `expiry` for payment expiration
- Added `allow_tips` option

### 5. Updated Webhook Events
- `payment_intent.payment_failed` → `payment_intent.failed`
- `charge.refunded` → `refund.succeeded`
- Added `payment_intent.canceled` event handling

## Usage Example

```typescript
// Create a payment intent with the new API
const paymentIntent = await this.ziinaService.createPaymentIntent(
  99.99, // Amount in USD
  'USD', // Currency
  {
    message: 'Payment for Order #12345',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    failureUrl: 'https://example.com/failure',
    test: true, // For testing
    allowTips: false
  }
);

// Use redirect_url to send user to payment page
console.log('Payment URL:', paymentIntent.redirect_url);
```

## Environment Variables
No changes needed to existing environment variables:
- `ZIINA_ACCESS_TOKEN`: Your Ziina API token
- `ZIINA_WEBHOOK_SECRET`: Webhook signature secret
- `ZIINA_API_URL`: (Optional) Override API URL

## Next Steps
1. Update any code that calls `createPaymentIntent` to use the new options parameter
2. Test webhook handling with new event types
3. Implement OAuth 2.0 for production (currently using static token)
4. Consider implementing the tips feature if relevant to your business

## Breaking Changes
- The `currency` field is now `currency_code` in responses
- Payment intent status values have changed
- Webhook event types have been updated