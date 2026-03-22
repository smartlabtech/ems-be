# Simplified Credit System

## Overview

The system now uses a **single credit system** based on token usage only:

- **Token Credits** (user.credits): The only credit system
- **No Message Limits**: Removed `creditsRemaining` from subscriptions
- **Usage**: All features deduct from user.credits based on actual token consumption

## Changes Made

### 1. Removed from Subscription Schema
- Removed `creditsRemaining` field
- Subscriptions no longer track message counts

### 2. Updated Brand Message Service
- Removed message limit checking
- Removed `incrementCreditsUsed` calls
- Only checks:
  - Active subscription required
  - Sufficient token credits (user.credits)

### 3. Updated Subscription Service  
- Removed `incrementCreditsUsed` method
- Updated `checkResourceLimit` for brandMessages to always return allowed
- Removed creditsRemaining initialization and renewal

## How It Works Now

### Project Creation
```
Check subscription → Check project limit → Create project
```
- Still limited by plan's `maxProjects`
- No token cost

### Brand Message Generation
```
Check subscription → Check token credits → Generate → Deduct tokens
```
- Only limited by available token credits
- No message count limits

### Project Product Creation
```
Check project access → Check token credits → Enhance → Deduct tokens
```
- Only limited by available token credits

## Credit Flow

With `TOKENS_PER_CREDIT=1`:
- 1 token used = 1 credit deducted
- 1496 tokens used = 1496 credits deducted

## Benefits

1. **Simpler System**: Only one type of credit to manage
2. **Flexible Usage**: Users can create as many messages as their tokens allow
3. **Fair Billing**: Pay exactly for what you use
4. **No Artificial Limits**: No message count restrictions

## Plan Features

Plans now define:
- `maxProjects`: Project limit (still enforced)
- `maxBrandMessages`: Can be removed or ignored
- `credits`: Token credits allocated monthly

## Token Allocation

When subscription is created/renewed:
- If plan has `credits`, adds those tokens to user.credits
- Users can use tokens for any AI features
- No separate message tracking

## Testing

1. Create a brand message:
```bash
curl -X POST http://localhost:3041/api/en/brandmessage \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID"}'
```

2. Check only token credits are deducted:
- user.credits decreases by tokens used
- No subscription.creditsRemaining changes (field removed)

## Migration Note

If you have existing subscriptions with creditsRemaining:
```javascript
// One-time cleanup
db.subscriptions.updateMany({}, { $unset: { creditsRemaining: "" } })
```