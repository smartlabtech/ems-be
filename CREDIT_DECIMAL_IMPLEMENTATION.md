# Implementing Decimal Credits for More Fair Token Usage

## Current Issue
- 1496 tokens currently costs 2 credits (with 1000 tokens/credit rate)
- This wastes 504 tokens worth of credit value

## Solution: Support Decimal Credits

### Option 1: Change Environment Variable (Easiest)
In your `.env` file:
```
TOKENS_PER_CREDIT=100
```

This makes the system 10x more granular:
- 1496 tokens = 14.96 ≈ 15 credits
- 100 tokens = 1 credit
- 50 tokens = 0.5 ≈ 1 credit

### Option 2: Modify Credit Calculation to Use Decimals

1. Update the credit service to support decimal deduction:

```typescript
// In credit.service.ts
calculateCreditsNeeded(tokens: number): number {
  // Return exact decimal instead of ceiling
  return tokens / this.tokenToCreditRate;
}

async deductCreditsForTokens(params: DeductCreditsParams): Promise<CreditTransactionDocument> {
  const creditsToDeduct = this.calculateCreditsNeeded(params.tokensUsed);
  // creditsToDeduct is now a decimal like 1.496
  
  // ... rest of the logic handles decimals naturally
}
```

2. Update the schema to ensure decimals are preserved:

```typescript
// In user.schema.ts
@Prop({ type: Number, default: 0, min: 0 })
credits: number; // MongoDB Number type supports decimals
```

### Option 3: Token Banking System

Implement a token remainder tracking system:

```typescript
// In user.schema.ts
@Prop({ default: 0, min: 0, max: 999 })
tokenRemainder: number; // Unused tokens from previous transactions

// In credit.service.ts
async deductCreditsWithRemainder(params: DeductCreditsParams) {
  const totalTokens = params.tokensUsed + (user.tokenRemainder || 0);
  const creditsToDeduct = Math.floor(totalTokens / this.tokenToCreditRate);
  const newRemainder = totalTokens % this.tokenToCreditRate;
  
  // Update user with new remainder
  user.credits -= creditsToDeduct;
  user.tokenRemainder = newRemainder;
}
```

## Recommendation

**Use Option 1** - Simply change `TOKENS_PER_CREDIT=100` in your environment:

### Benefits:
- No code changes required
- More granular credit usage
- Easy to adjust based on your pricing model
- 10x more precision in token usage

### Example with TOKENS_PER_CREDIT=100:
- 50 tokens = 1 credit
- 150 tokens = 2 credits  
- 1496 tokens = 15 credits
- 5000 tokens = 50 credits

### To implement:
1. Update your `.env` file:
   ```
   TOKENS_PER_CREDIT=100
   ```

2. Restart your application

3. Optionally, multiply existing user credits by 10 to maintain their value:
   ```javascript
   // One-time migration
   db.users.updateMany({}, { $mul: { credits: 10 } })
   ```

This provides a much fairer token-to-credit conversion without requiring code changes.