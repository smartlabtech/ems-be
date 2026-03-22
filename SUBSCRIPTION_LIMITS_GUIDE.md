# Subscription Limits and Credit System Guide

## Overview

The system implements subscription-based limits for resource creation and usage. Users must have an active subscription to create projects and generate brand messages. Each subscription plan defines specific limits for different resources.

## Resource Types and Limits

### 1. Projects
- **Limit Type**: Count-based
- **Checked at**: Project creation
- **Plan Feature**: `maxProjects`
- **Example**: Free plan allows 1 project, Pro plan allows 10 projects

### 2. Brand Messages
- **Limit Type**: Credit-based (via creditsRemaining)
- **Checked at**: Message generation
- **Plan Feature**: `maxBrandMessages`
- **Credits Deducted**: 1 from `creditsRemaining` per message
- **Reset**: Credits reset to `maxBrandMessages` on subscription renewal
- **Example**: Free plan allows 10 messages/month, Pro plan allows 1000 messages/month

## Implementation Details

### Project Creation Limits

When creating a project (`/src/BrandBanda/project/service.ts`):

```typescript
// 1. Check if user has active subscription
const hasSubscription = await this.subscriptionService.checkUserHasActiveSubscription(creator._id.toString());
if (!hasSubscription) {
    throw new BadRequestException('An active subscription is required to create projects');
}

// 2. Check project limit
const canCreateProject = await this.subscriptionService.checkResourceLimit(
    creator._id.toString(),
    'projects'
);

if (!canCreateProject.allowed) {
    throw new BadRequestException(
        `Project limit reached. Your plan allows ${canCreateProject.limit} projects and you have ${canCreateProject.current}.`
    );
}
```

### Brand Message Generation Limits

When generating a brand message (`/src/BrandBanda/project_brand_message/service.ts`):

```typescript
// 1. Check subscription
const hasSubscription = await this.subscriptionService.checkUserHasActiveSubscription(creator._id.toString());

// 2. Check message limit
const canCreateMessage = await this.subscriptionService.checkResourceLimit(
    creator._id.toString(),
    'brandMessages'
);

// 3. After successful generation, increment credits used
await this.subscriptionService.incrementCreditsUsed(creator._id.toString(), 1);
```

## Credit System

### Two Types of Credits

1. **Token Credits** (User Balance)
   - Stored in user.credits field
   - Used for AI token consumption
   - 1 credit = 1000 tokens (configurable via `TOKENS_PER_CREDIT` env var)
   - Can be purchased or allocated via plan's `credits`
   - Deducted based on actual AI usage

2. **Message Credits** (Subscription Limit)
   - Stored in subscription.creditsRemaining field
   - Initialized to plan's `maxBrandMessages` value
   - Decremented by 1 per brand message generation
   - Reset to `maxBrandMessages` on subscription renewal
   - Enforces monthly message limits

### Dual Tracking for Brand Messages
When generating a brand message:
1. **Check**: Verify subscription.creditsRemaining > 0
2. **Generate**: Create the brand message
3. **Deduct Token Credits**: Based on actual AI token usage from user.credits
4. **Decrement Message Credits**: Reduce subscription.creditsRemaining by 1

## Subscription Service Methods

### checkUserHasActiveSubscription(userId)
- Returns: `boolean`
- Checks if user has subscription with status 'active' or 'trialing'

### checkResourceLimit(userId, resource)
- Returns: `{ allowed: boolean, limit: number, current: number }`
- Resources: 'projects', 'brandMessages'
- Checks against plan features and current usage

### incrementCreditsUsed(userId, amount)
- Decrements the `creditsRemaining` field on subscription by amount
- Used for tracking brand message usage against monthly limits

## Plan Features Schema

```typescript
features: {
    // ... other features
}
```

## Error Messages

### No Subscription
- "An active subscription is required to create projects"
- "An active subscription is required to generate brand messages"

### Limit Reached
- "Project limit reached. Your plan allows X projects and you have Y."
- "Brand message limit reached. Your plan allows X messages and you have used Y."

### Insufficient Credits
- Thrown by CreditService when token credits are insufficient
- Includes required credits and current balance

## Testing Limits

### 1. Test Project Limits
```bash
# Create projects until limit is reached
for i in {1..5}; do
  curl -X POST http://localhost:3041/api/en/project \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "businessName": "Test Project '$i'",
      "businessType": "E-commerce"
    }'
done
```

### 2. Test Brand Message Limits
```bash
# Generate messages until limit is reached
for i in {1..15}; do
  curl -X POST http://localhost:3041/api/en/brandmessage \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "productId": "PRODUCT_ID"
    }'
done
```

## Reset Limits

Limits reset based on billing cycle:
- Monthly plans: Reset on the same day each month
- Quarterly plans: Reset every 3 months
- Yearly plans: Reset annually

The reset happens automatically when:
1. Subscription renews
2. New billing period starts
3. Manual reset by admin

## Best Practices

1. **Check Early**: Always check limits before expensive operations
2. **Clear Messages**: Provide clear error messages with current usage
3. **Grace Period**: Consider implementing soft limits with warnings
4. **Usage Tracking**: Show users their current usage in UI
5. **Notifications**: Alert users when approaching limits

## API Endpoints for Usage

### Get Current Usage
```
GET /api/{lang}/subscription/current
```
Returns subscription with `creditsUsed` field

### Check Specific Limit
```
GET /api/{lang}/subscription/{id}/check-limit/{resource}
```
Returns detailed limit information

## Future Enhancements

1. **Soft Limits**: Warn at 80% usage
2. **Overage Pricing**: Allow exceeding limits with additional charges
3. **Credit Packages**: One-time credit purchases
4. **Usage Analytics**: Detailed usage reports
5. **API Rate Limiting**: Implement per-minute/hour limits