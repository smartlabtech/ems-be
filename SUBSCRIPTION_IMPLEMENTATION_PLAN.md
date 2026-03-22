# Subscription System Implementation Plan with Ziina Payment Gateway

## Overview
This document outlines the implementation plan for a subscription-based system with credit recharge functionality using Ziina payment gateway.

## System Architecture

### Core Components
1. **Plan Module** - Manages subscription plans
2. **Order Module** - Handles order creation and processing
3. **Invoice Module** - Manages billing and invoice generation
4. **Payment Module** - Integrates with Ziina payment gateway
5. **Subscription Module** - Manages user subscriptions and renewals

## Implementation Checklist

### Phase 1: Database Schema Design

#### 1. Plan Schema
- [ ] Create Plan schema with fields:
  - [ ] `name`: String (required)
  - [ ] `description`: String
  - [ ] `price`: Number (required)
  - [ ] `currency`: String (default: 'USD')
  - [ ] `billingCycle`: Enum ['monthly', 'quarterly', 'yearly']
  - [ ] `credits`: Number
  - [ ] `maxProjects`: Number
  - [ ] `maxBrandMessages`: Number
  - [ ] `features`: Object containing:
    - [ ] `supportLevel`: String
    - [ ] Other feature flags
  - [ ] `noticePeriod`: Number (days after 30-day cycle)
  - [ ] `isActive`: Boolean (default: true)
  - [ ] `isDefault`: Boolean
  - [ ] `sortOrder`: Number
  - [ ] `metadata`: Object (for custom data)
  - [ ] `createdAt`, `updatedAt`: Date

#### 2. Subscription Schema
- [ ] Create Subscription schema with fields:
  - [ ] `userId`: ObjectId (ref: User)
  - [ ] `planId`: ObjectId (ref: Plan)
  - [ ] `status`: Enum ['active', 'cancelled', 'expired', 'past_due', 'trialing']
  - [ ] `currentPeriodStart`: Date
  - [ ] `currentPeriodEnd`: Date
  - [ ] `cancelAt`: Date (nullable)
  - [ ] `cancelledAt`: Date (nullable)
  - [ ] `trialStart`: Date (nullable)
  - [ ] `trialEnd`: Date (nullable)
  - [ ] `creditsRemaining`: Number
  - [ ] `creditsRenewAt`: Date
  - [ ] `paymentMethod`: Object
  - [ ] `metadata`: Object
  - [ ] `createdAt`, `updatedAt`: Date

#### 3. Order Schema
- [ ] Create Order schema with fields:
  - [ ] `orderNumber`: String (unique, auto-generated)
  - [ ] `userId`: ObjectId (ref: User)
  - [ ] `type`: Enum ['subscription', 'credit_recharge', 'plan_change']
  - [ ] `status`: Enum ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']
  - [ ] `items`: Array of:
    - [ ] `type`: String
    - [ ] `referenceId`: ObjectId (Plan or Credit Package)
    - [ ] `quantity`: Number
    - [ ] `unitPrice`: Number
    - [ ] `totalPrice`: Number
    - [ ] `description`: String
  - [ ] `subtotal`: Number
  - [ ] `tax`: Number
  - [ ] `total`: Number
  - [ ] `currency`: String
  - [ ] `paymentIntentId`: String (Ziina reference)
  - [ ] `paymentStatus`: String
  - [ ] `paymentMethod`: Object
  - [ ] `billingAddress`: Object
  - [ ] `notes`: String
  - [ ] `metadata`: Object
  - [ ] `createdAt`, `updatedAt`: Date

#### 4. Invoice Schema
- [ ] Create Invoice schema with fields:
  - [ ] `invoiceNumber`: String (unique, auto-generated)
  - [ ] `userId`: ObjectId (ref: User)
  - [ ] `orderId`: ObjectId (ref: Order)
  - [ ] `subscriptionId`: ObjectId (ref: Subscription)
  - [ ] `status`: Enum ['draft', 'sent', 'paid', 'void', 'uncollectible']
  - [ ] `dueDate`: Date
  - [ ] `paidAt`: Date
  - [ ] `items`: Array (same structure as Order items)
  - [ ] `subtotal`: Number
  - [ ] `tax`: Number
  - [ ] `total`: Number
  - [ ] `currency`: String
  - [ ] `paymentUrl`: String (Ziina payment link)
  - [ ] `pdfUrl`: String (generated invoice PDF)
  - [ ] `billingDetails`: Object
  - [ ] `notes`: String
  - [ ] `metadata`: Object
  - [ ] `createdAt`, `updatedAt`: Date

#### 5. Payment Transaction Schema
- [ ] Create PaymentTransaction schema with fields:
  - [ ] `transactionId`: String (unique)
  - [ ] `userId`: ObjectId (ref: User)
  - [ ] `orderId`: ObjectId (ref: Order)
  - [ ] `invoiceId`: ObjectId (ref: Invoice)
  - [ ] `provider`: String (default: 'ziina')
  - [ ] `providerTransactionId`: String
  - [ ] `type`: Enum ['payment', 'refund', 'partial_refund']
  - [ ] `status`: Enum ['pending', 'processing', 'succeeded', 'failed', 'cancelled']
  - [ ] `amount`: Number
  - [ ] `currency`: String
  - [ ] `paymentMethod`: Object
  - [ ] `providerResponse`: Object (raw Ziina response)
  - [ ] `errorMessage`: String
  - [ ] `refundedAmount`: Number
  - [ ] `metadata`: Object
  - [ ] `createdAt`, `updatedAt`: Date

#### 6. Credit Package Schema (for recharge options)
- [ ] Create CreditPackage schema with fields:
  - [ ] `name`: String
  - [ ] `credits`: Number
  - [ ] `price`: Number
  - [ ] `currency`: String
  - [ ] `discount`: Number (percentage)
  - [ ] `isActive`: Boolean
  - [ ] `sortOrder`: Number
  - [ ] `metadata`: Object

### Phase 2: Ziina Payment Gateway Integration

#### 1. OAuth 2.0 Setup
- [ ] Register application with Ziina
- [ ] Store OAuth credentials securely:
  - [ ] `ZIINA_CLIENT_ID`
  - [ ] `ZIINA_CLIENT_SECRET`
  - [ ] `ZIINA_REDIRECT_URI`
  - [ ] `ZIINA_WEBHOOK_SECRET`
- [ ] Implement OAuth flow:
  - [ ] Authorization endpoint
  - [ ] Token exchange endpoint
  - [ ] Token refresh logic
  - [ ] Secure token storage

#### 2. Ziina Service Implementation
- [ ] Create ZiinaService with methods:
  - [ ] `createPaymentIntent(amount, currency, options)` - v2 API with redirect URL
  - [ ] `getPaymentIntent(paymentIntentId)` - Get payment status
  - [ ] `refundPayment(transactionId, amount)`
  - [ ] `validateWebhookSignature(payload, signature)`
  - [ ] `handleWebhookEvent(event)`

#### 3. Webhook Handling
- [ ] Create webhook endpoint `/webhooks/ziina`
- [ ] Implement webhook handlers for:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.failed`
  - [ ] `payment_intent.canceled`
  - [ ] `refund.succeeded`
- [ ] Add webhook signature validation
- [ ] Implement idempotency for webhook processing

### Phase 3: Business Logic Implementation

#### 1. Plan Service
- [ ] Implement PlanService methods:
  - [ ] `createPlan(planData)`
  - [ ] `updatePlan(planId, updates)`
  - [ ] `deactivatePlan(planId)`
  - [ ] `getActivePlans()`
  - [ ] `getPlanById(planId)`
  - [ ] `canUserAccessPlan(userId, planId)`

#### 2. Subscription Service
- [ ] Implement SubscriptionService methods:
  - [ ] `createSubscription(userId, planId, paymentMethod)`
  - [ ] `updateSubscription(subscriptionId, updates)`
  - [ ] `cancelSubscription(subscriptionId, immediately)`
  - [ ] `reactivateSubscription(subscriptionId)`
  - [ ] `changeSubscriptionPlan(subscriptionId, newPlanId)`
  - [ ] `checkSubscriptionStatus(subscriptionId)`
  - [ ] `renewSubscription(subscriptionId)`
  - [ ] `handleSubscriptionExpiry(subscriptionId)`
  - [ ] `allocateMonthlyCredits(subscriptionId)`
  - [ ] `isInNoticePeriod(subscription)`
  - [ ] `canMaintainLegacyPlan(subscription)`

#### 3. Order Service
- [ ] Implement OrderService methods:
  - [ ] `createOrder(userId, items, type)`
  - [ ] `updateOrderStatus(orderId, status)`
  - [ ] `processOrder(orderId)`
  - [ ] `cancelOrder(orderId)`
  - [ ] `generateOrderNumber()`
  - [ ] `calculateOrderTotals(items)`
  - [ ] `applyTaxes(subtotal, userLocation)`

#### 4. Invoice Service
- [ ] Implement InvoiceService methods:
  - [ ] `createInvoice(orderId, dueDate)`
  - [ ] `updateInvoiceStatus(invoiceId, status)`
  - [ ] `markInvoiceAsPaid(invoiceId, paymentId)`
  - [ ] `generateInvoiceNumber()`
  - [ ] `generateInvoicePDF(invoiceId)`
  - [ ] `sendInvoiceEmail(invoiceId)`
  - [ ] `createRecurringInvoice(subscriptionId)`

#### 5. Credit Management Integration
- [ ] Update CreditService to:
  - [ ] Check subscription credits before deduction
  - [ ] Deduct from subscription credits first
  - [ ] Handle credit recharge purchases
  - [ ] Track credit usage per subscription period

### Phase 4: Subscription Lifecycle Management

#### 1. Subscription Creation Flow
- [ ] User selects plan
- [ ] Create order for subscription
- [ ] Generate invoice
- [ ] Create Ziina payment link
- [ ] Handle payment success:
  - [ ] Create/activate subscription
  - [ ] Allocate initial credits
  - [ ] Send welcome email
  - [ ] Mark invoice as paid

#### 2. Recurring Billing
- [ ] Create cron job for daily subscription checks
- [ ] For each active subscription due for renewal:
  - [ ] Check if in notice period
  - [ ] Create renewal order
  - [ ] Generate invoice
  - [ ] Attempt automatic payment (if payment method saved)
  - [ ] Handle payment success/failure
  - [ ] Update subscription period
  - [ ] Allocate monthly credits

#### 3. Plan Changes
- [ ] Calculate prorated amounts
- [ ] Handle immediate vs end-of-period changes
- [ ] Process upgrade payments
- [ ] Handle downgrade credits
- [ ] Maintain legacy plan if conditions met

#### 4. Cancellation Flow
- [ ] Accept cancellation request
- [ ] Set cancel_at date (end of period)
- [ ] Stop recurring billing
- [ ] Handle reactivation within notice period
- [ ] Clean up expired subscriptions

### Phase 5: API Endpoints

#### 1. Plan Endpoints
- [ ] `GET /api/plans` - List active plans
- [ ] `GET /api/plans/:id` - Get plan details
- [ ] `POST /api/admin/plans` - Create plan (admin)
- [ ] `PUT /api/admin/plans/:id` - Update plan (admin)
- [ ] `DELETE /api/admin/plans/:id` - Deactivate plan (admin)

#### 2. Subscription Endpoints
- [ ] `GET /api/subscriptions/current` - Get user's subscription
- [ ] `POST /api/subscriptions` - Create subscription
- [ ] `PUT /api/subscriptions/:id` - Update subscription
- [ ] `POST /api/subscriptions/:id/cancel` - Cancel subscription
- [ ] `POST /api/subscriptions/:id/reactivate` - Reactivate
- [ ] `POST /api/subscriptions/:id/change-plan` - Change plan

#### 3. Order Endpoints
- [ ] `GET /api/orders` - List user's orders
- [ ] `GET /api/orders/:id` - Get order details
- [ ] `POST /api/orders` - Create order
- [ ] `POST /api/orders/:id/pay` - Initiate payment

#### 4. Invoice Endpoints
- [ ] `GET /api/invoices` - List user's invoices
- [ ] `GET /api/invoices/:id` - Get invoice details
- [ ] `GET /api/invoices/:id/pdf` - Download PDF
- [ ] `POST /api/invoices/:id/send` - Send invoice email

#### 5. Payment Endpoints
- [ ] `POST /api/payments/create-intent` - Create payment intent
- [ ] `GET /api/payments/:id/status` - Check payment status
- [ ] `POST /api/webhooks/ziina` - Webhook endpoint

#### 6. Credit Recharge Endpoints
- [ ] `GET /api/credit-packages` - List packages
- [ ] `POST /api/credits/recharge` - Purchase credits

### Phase 6: Testing

#### 1. Unit Tests
- [ ] Plan service tests
- [ ] Subscription service tests
- [ ] Order service tests
- [ ] Invoice service tests
- [ ] Payment service tests
- [ ] Webhook handler tests

#### 2. Integration Tests
- [ ] Ziina API integration tests
- [ ] Subscription lifecycle tests
- [ ] Payment flow tests
- [ ] Credit allocation tests

#### 3. E2E Tests
- [ ] Complete subscription flow
- [ ] Plan change scenarios
- [ ] Cancellation and reactivation
- [ ] Credit recharge flow

### Phase 7: Security & Compliance

#### 1. Security Measures
- [ ] Implement rate limiting on payment endpoints
- [ ] Add fraud detection rules
- [ ] Secure webhook endpoints
- [ ] Encrypt sensitive payment data
- [ ] Implement PCI compliance measures

#### 2. Logging & Monitoring
- [ ] Log all payment transactions
- [ ] Monitor failed payments
- [ ] Alert on subscription failures
- [ ] Track conversion metrics

### Phase 8: Documentation

#### 1. API Documentation
- [ ] Document all endpoints with Swagger
- [ ] Include request/response examples
- [ ] Document error codes

#### 2. Integration Guide
- [ ] Ziina setup guide
- [ ] Webhook configuration
- [ ] Testing guide

#### 3. User Documentation
- [ ] Subscription management guide
- [ ] Billing FAQ
- [ ] Credit usage guide

## Environment Variables

```env
# Ziina Configuration
ZIINA_CLIENT_ID=your_client_id
ZIINA_CLIENT_SECRET=your_client_secret
ZIINA_API_URL=https://api-v2.ziina.com/api
ZIINA_REDIRECT_URI=https://your-domain.com/auth/ziina/callback
ZIINA_WEBHOOK_SECRET=your_webhook_secret
ZIINA_ACCESS_TOKEN=your_access_token

# Subscription Configuration
SUBSCRIPTION_GRACE_PERIOD_DAYS=7
CREDIT_RENEWAL_DAY=1
DEFAULT_PLAN_ID=free_plan_id

# Invoice Configuration
INVOICE_PREFIX=INV
ORDER_PREFIX=ORD
COMPANY_NAME=Your Company
COMPANY_ADDRESS=Your Address
COMPANY_TAX_ID=Your Tax ID
```

## Key Business Rules

1. **Notice Period**: Each plan has a configurable notice period (days after 30-day cycle)
2. **Legacy Plan Retention**: Users can maintain discontinued plans if they pay within notice period
3. **Credit Allocation**: Credits are allocated on subscription start and monthly renewal
4. **Prorated Billing**: Plan changes are prorated based on remaining days
5. **Grace Period**: Failed payments have a 7-day grace period before suspension

## Recommended Implementation Order

1. Start with database schemas
2. Implement basic CRUD services
3. Integrate Ziina payment gateway
4. Build subscription lifecycle management
5. Add API endpoints
6. Implement webhook handlers
7. Add testing
8. Deploy with monitoring

This plan provides a comprehensive roadmap for implementing the subscription system with Ziina payment integration.