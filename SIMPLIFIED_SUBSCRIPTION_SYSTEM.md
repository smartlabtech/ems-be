# Simplified Subscription System

## Overview

The subscription system has been simplified to focus on credit-based access with expiration dates rather than traditional auto-renewing subscriptions.

## Removed Fields

### From Subscription Schema:
- ❌ `trialStart` & `trialEnd` - No trial periods (non-refundable)
- ❌ `creditsRemaining` - Managed by user.credits
- ❌ `creditsRenewAt` - No credit renewal in subscriptions
- ❌ `paymentMethod` - Handled by Ziina third-party
- ❌ `autoRenew` - Credit-based with expiration

### Remaining Fields:
- ✅ `userId` - User reference
- ✅ `planId` - Plan reference
- ✅ `status` - Subscription status
- ✅ `currentPeriodStart` - Start date
- ✅ `currentPeriodEnd` - Expiration date
- ✅ `cancelAt` - Scheduled cancellation
- ✅ `cancelledAt` - Actual cancellation date
- ✅ `gracePeriodDays` - Grace period
- ✅ `gracePeriodEnd` - Grace period end
- ✅ `metadata` - Additional data

## System Behavior

### Credit Management
- All credits stored in `user.credits`
- Token usage deducts from user credits
- No separate subscription credits

### Subscription Lifecycle
1. **Creation**: User purchases a plan
2. **Active Period**: Access until `currentPeriodEnd`
3. **Expiration**: Status changes to 'expired'
4. **No Auto-renewal**: User must manually purchase

### Payment Flow
- Payments handled by Ziina
- No payment method storage
- One-time purchases only

## API Changes

### Removed Endpoints:
- ❌ `PUT /subscription/:id/payment-method`

### Updated DTOs:
- Removed `autoRenew` from all DTOs
- Removed `paymentMethod` from all DTOs
- Removed `trialStart/trialEnd` from creation
- Removed `applyTrial` from initiation

## Benefits

1. **Simpler Model**: No complex renewal logic
2. **Clear Expiration**: Users know exactly when access ends
3. **Flexible Credits**: All AI usage from single credit pool
4. **No Payment Storage**: Enhanced security
5. **Transparent Billing**: Pay-as-you-go credits

## Migration

For existing subscriptions:
```javascript
// Remove unused fields
db.subscriptions.updateMany({}, { 
  $unset: { 
    creditsRemaining: "",
    creditsRenewAt: "",
    paymentMethod: "",
    autoRenew: "",
    trialStart: "",
    trialEnd: ""
  } 
})
```

## Usage Example

1. User purchases a monthly plan for $29
2. Subscription created with:
   - `currentPeriodStart`: Today
   - `currentPeriodEnd`: Today + 30 days
   - `status`: 'active'
3. User gets token credits added to their account
4. After 30 days, subscription expires
5. User must purchase again for continued access

This simplified system aligns with a credit-based model where users purchase access periods and consume credits for AI operations.