# Option: Unified Credit System

## Current System (Recommended to Keep)
- **user.credits**: Token balance (for AI costs)
- **subscription.creditsRemaining**: Message count limit

## Alternative: Unified Token-Based System

If you want subscription.creditsRemaining to track tokens instead of messages:

### Changes Required:

1. **Update Subscription Creation**:
```typescript
// In subscription service
creditsRemaining: plan.maxBrandMessages * 1500, // e.g., 10 messages * 1500 avg tokens
```

2. **Update Brand Message Service**:
```typescript
// Instead of:
await this.subscriptionService.incrementCreditsUsed(creator._id.toString(), 1);

// Change to:
await this.subscriptionService.incrementCreditsUsed(creator._id.toString(), totalTokensUsed);
```

3. **Update checkResourceLimit**:
```typescript
case 'brandMessages':
  // No longer check message count, check token balance
  return {
    allowed: subscription.creditsRemaining >= estimatedTokens,
    limit: subscription.creditsRemaining,
    current: plan.maxBrandMessages * 1500 - subscription.creditsRemaining
  };
```

### Pros:
- Single credit system
- More flexible (users can create many small messages or few large ones)

### Cons:
- Harder to predict costs (messages use variable tokens)
- Plans become harder to understand ("10,000 tokens" vs "10 messages")
- Need to estimate average token usage per message

## Recommendation: Keep Current System

The dual system is clearer:
- Plans advertise "X messages per month" (easy to understand)
- Token credits handle actual AI costs
- Users know exactly how many messages they can create

## About TOKENS_PER_CREDIT=1

This setting means:
- 1 token = 1 credit
- Very precise but might create large numbers
- Consider using 100 or 1000 for cleaner numbers:
  - TOKENS_PER_CREDIT=100: 1 credit = 100 tokens
  - TOKENS_PER_CREDIT=1000: 1 credit = 1000 tokens