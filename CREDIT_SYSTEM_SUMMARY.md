# Credit System Implementation Summary

## Overview

The system implements a comprehensive credit and subscription limit system with two types of credits:

1. **Token Credits** - For AI operations (stored in user.credits)
2. **Message Credits** - For subscription limits (stored in subscription.creditsRemaining)

## Implementation Status

### ✅ Project Creation (`/src/BrandBanda/project/`)
- **Subscription Check**: Users must have an active subscription
- **Limit Check**: Enforces plan's `maxProjects` limit
- **No Token Cost**: Creating projects doesn't consume token credits

### ✅ Brand Message Generation (`/src/BrandBanda/project_brand_message/`)
- **Subscription Check**: Users must have an active subscription
- **Message Limit Check**: Enforces plan's `maxBrandMessages` via `creditsRemaining`
- **Dual Credit System**:
  - Decrements `subscription.creditsRemaining` by 1
  - Deducts token credits based on actual AI usage

### ✅ Project Product/Version Creation (`/src/BrandBanda/project_product/`)
- **Implicit Subscription Check**: Requires existing project (which requires subscription)
- **Token Credits Only**: Uses token credits for AI enhancement
- **No Message Credits**: Doesn't count against brand message limits

## Credit Flow

### For Projects
```
User creates project → Check subscription → Check project limit → Create project
```

### For Brand Messages
```
User generates message → Check subscription → Check message limit → Generate → Deduct both credit types
```

### For Project Products
```
User creates version → Check project access → Check token credits → Enhance with AI → Deduct token credits
```

## Key Methods Added

### SubscriptionService
- `checkUserHasActiveSubscription(userId)` - Verifies active/trial subscription
- `checkResourceLimit(userId, resource)` - Checks limits for 'projects' or 'brandMessages'
- `incrementCreditsUsed(userId, amount)` - Decrements creditsRemaining

## Database Fields

### User Schema
- `credits`: Token credit balance for AI operations

### Subscription Schema
- `creditsRemaining`: Message credits remaining in current period
- Initialized to `plan.maxBrandMessages`
- Reset on subscription renewal

### Plan Features
- `maxProjects`: Maximum projects allowed
- `maxBrandMessages`: Maximum brand messages per billing period
- `credits`: Token credits allocated monthly (optional)

## Error Messages

- "An active subscription is required to create projects"
- "Project limit reached. Your plan allows X projects and you have Y."
- "An active subscription is required to generate brand messages"
- "Brand message limit reached. Your plan allows X messages and you have used Y."
- InsufficientCreditsException for token credits

## Testing the System

1. **Create Free Plan**:
   ```bash
   npx ts-node scripts/seed-free-plan.ts
   ```

2. **Test Project Limits**:
   - Create projects until limit reached
   - Verify error message

3. **Test Brand Message Limits**:
   - Generate messages until creditsRemaining = 0
   - Verify error message

4. **Test Token Credits**:
   - Use AI features until user.credits depleted
   - Verify InsufficientCreditsException

## Configuration

- `TOKENS_PER_CREDIT`: Environment variable (default: 1000)
- Token credits can be purchased or allocated via plan
- Message credits are fixed per plan and reset on renewal

## Notes

- Project creation is "free" (no token cost) but requires subscription
- Brand messages cost both token credits (for AI) and message credits (for limits)
- Project products only cost token credits (for AI enhancement)
- All limits reset based on billing cycle