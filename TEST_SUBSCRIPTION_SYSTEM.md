# Testing the Subscription System

## Quick Test Guide

### 1. Test Plan Endpoints

```bash
# Get all plans
curl -X GET http://localhost:3000/api/plans

# Get default plan
curl -X GET http://localhost:3000/api/plans/default

# Create a plan (Admin only - need JWT token)
curl -X POST http://localhost:3000/api/plans \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan",
    "description": "Test plan for development",
    "price": 199,
    "credits": 2000,
    "maxProjects": 10,
    "maxBrandMessages": 100,
    "maxProductVersions": 50,
    "apiAccess": true,
    "teamMembers": 5,
    "supportLevel": "basic",
    "customBranding": false,
    "features": {
      
    }
  }'
```

### 2. Test Subscription Creation

```bash
# Create subscription (Authenticated user)
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "PLAN_ID_HERE"
  }'

# Get current subscription
curl -X GET http://localhost:3000/api/subscriptions/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Order Creation

```bash
# Create order for subscription
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscription",
    "items": [{
      "type": "plan",
      "referenceId": "PLAN_ID",
      "quantity": 1,
      "unitPrice": 99,
      "totalPrice": 99,
      "description": "Starter Plan Subscription"
    }]
  }'
```

### 4. Test Webhook

```bash
# Simulate successful payment
curl -X POST http://localhost:3000/webhooks/ziina \
  -H "Content-Type: application/json" \
  -H "ziina-signature: test_signature" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "amount": 9900,
        "currency": "USD",
        "metadata": {
          "orderId": "ORDER_ID",
          "invoiceId": "INVOICE_ID",
          "userId": "USER_ID"
        }
      }
    }
  }'
```

## All Compilation Errors Fixed ✅

The subscription system is now ready for testing. All TypeScript compilation errors have been resolved:

1. ✅ Fixed missing `nanoid` and `pdfkit` dependencies
2. ✅ Fixed `@nestjs/schedule` version compatibility
3. ✅ Fixed `exists()` type error in order service
4. ✅ Fixed missing `type` property in credit service calls
5. ✅ Removed session parameter from credit service calls (not required)

## Environment Setup

Before testing, ensure you have:

1. MongoDB running
2. Environment variables set in `.env`
3. JWT authentication configured
4. Admin user created for testing admin endpoints

## Next Steps

1. Start the application: `npm run start:dev`
2. Seed default plans using the seeder service
3. Test each endpoint progressively
4. Monitor logs for any runtime issues