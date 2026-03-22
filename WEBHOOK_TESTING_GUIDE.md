# Webhook Testing Guide

## Quick Test

1. **Run all webhook tests**:
   ```bash
   node test-webhook.js
   ```

2. **Test specific scenarios**:
   ```bash
   # Test payment success only
   node test-webhook.js --success
   
   # Test payment failure only
   node test-webhook.js --failure
   
   # Test invalid signature
   node test-webhook.js --invalid
   ```

## Manual Testing with cURL

### Test Payment Success
```bash
# First, create a test payload
PAYLOAD='{
  "id": "evt_test_123",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_test_123",
      "amount": 10395,
      "currency": "USD",
      "status": "completed",
      "payment_method_details": {
        "type": "card",
        "card": {
          "last4": "4242",
          "brand": "visa"
        }
      },
      "metadata": {
        "orderId": "688b8b9a0235967928b9959d",
        "orderType": "subscription",
        "userId": "68701ad3bf3135725495e1a6"
      }
    }
  }
}'

# Generate signature (using Node.js)
SIGNATURE=$(node -e "
const crypto = require('crypto');
const payload = $PAYLOAD;
const secret = '01273215942';
console.log(crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex'));
")

# Send webhook
curl -X POST http://localhost:3041/webhooks/ziina \
  -H "Content-Type: application/json" \
  -H "ziina-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

## Using ngrok for Production Webhooks

1. **Install ngrok**:
   ```bash
   # Download from https://ngrok.com/download
   # Or use npm
   npm install -g ngrok
   ```

2. **Expose your local server**:
   ```bash
   ngrok http 3041
   ```

3. **Configure Ziina webhook**:
   - Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - In Ziina dashboard, set webhook URL to: `https://abc123.ngrok.io/webhooks/ziina`

## Testing with Ziina Test Mode

1. **Create a real payment in test mode**:
   ```bash
   # Create order and get payment link
   curl -X POST http://localhost:3041/api/en/payment/checkout/YOUR_ORDER_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Complete test payment**:
   - Visit the payment URL
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVV

3. **Monitor webhook logs**:
   ```bash
   # Watch your server logs
   tail -f your-app.log | grep -i webhook
   ```

## Webhook Event Types

### Supported Events
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment was cancelled
- `charge.refunded` - Refund processed
- `payment_link.paid` - Payment link was paid

### Event Flow
```
1. User completes payment on Ziina
   ↓
2. Ziina sends webhook to your server
   ↓
3. Your server verifies signature
   ↓
4. Process webhook based on event type
   ↓
5. Update order/subscription status
   ↓
6. Return 200 OK to Ziina
```

## Debugging Tips

1. **Check webhook signature**:
   - Ensure `ZIINA_WEBHOOK_SECRET` in .env matches Ziina dashboard
   - Signature must be exact match (case-sensitive)

2. **Common issues**:
   - Wrong webhook URL in Ziina dashboard
   - Firewall blocking webhook requests
   - Server not running or port not exposed
   - Invalid signature due to wrong secret

3. **Test locally first**:
   - Use the test-webhook.js script
   - Verify order exists in database
   - Check user has correct permissions

## Production Checklist

- [ ] Webhook URL is HTTPS
- [ ] Webhook secret is configured correctly
- [ ] Error handling for duplicate webhooks
- [ ] Idempotency to handle retries
- [ ] Logging for all webhook events
- [ ] Monitoring/alerts for webhook failures
- [ ] Signature verification is enabled
- [ ] Response time under 20 seconds