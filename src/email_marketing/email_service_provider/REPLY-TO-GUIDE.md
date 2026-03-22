# Reply-To Email Field Guide 📧

## Table of Contents
- [Overview](#overview)
- [What is Reply-To?](#what-is-reply-to)
- [Use Cases & Scenarios](#use-cases--scenarios)
- [Best Practices](#best-practices)
- [Implementation Examples](#implementation-examples)
- [Common Patterns](#common-patterns)
- [Advanced Configurations](#advanced-configurations)
- [Troubleshooting](#troubleshooting)

## Overview

The `replyTo` field is a powerful email header that controls where recipient replies are directed. This guide covers comprehensive use cases, best practices, and implementation strategies for effective email communication.

## What is Reply-To?

The `replyTo` field specifies the email address that should receive replies when recipients click "Reply" in their email client. It operates independently of:

- ✅ Sender email address (`From` header)
- ✅ Recipient database status
- ✅ Email type (new, reply, forward)
- ✅ Provider configuration

### Key Benefits
- **Professional Communication**: Route replies to appropriate teams
- **Email Organization**: Separate sending and receiving addresses
- **Improved Deliverability**: Use system emails for sending, personal emails for replies
- **Team Collaboration**: Direct replies to shared inboxes

## Use Cases & Scenarios

### 🎯 Marketing & Newsletter Campaigns

**Scenario**: Send newsletters from a system email but direct replies to marketing team

```typescript
{
  senderEmail: "newsletter@yourcompany.com",
  replyTo: "marketing@yourcompany.com",
  subject: "Monthly Newsletter - {{monthName}} Edition",
  recipients: [...]
}
```

**Benefits**:
- System email maintains deliverability
- Marketing team handles engagement
- Centralized response management

### 🛠️ Customer Support Communications

**Scenario**: System notifications with support team replies

```typescript
{
  senderEmail: "noreply@yourcompany.com",
  replyTo: "support@yourcompany.com",
  subject: "Your ticket #{{ticketNumber}} has been updated",
  recipients: [...]
}
```

**Benefits**:
- Clear "no-reply" sender indication
- Direct path to support team
- Maintains ticket workflow

### 💼 Sales & Business Development

**Scenario**: Sales campaigns with personal touch

```typescript
{
  senderEmail: "campaigns@yourcompany.com",
  replyTo: "john.doe@yourcompany.com",
  subject: "Exclusive offer for {{companyName}}",
  recipients: [...]
}
```

**Benefits**:
- Professional campaign sender
- Personal sales representative contact
- Relationship building focus

### 🏢 Department-Specific Communications

**Scenario**: HR announcements with HR team replies

```typescript
{
  senderEmail: "announcements@yourcompany.com",
  replyTo: "hr@yourcompany.com",
  subject: "Company Policy Update - {{policyName}}",
  recipients: [...]
}
```

**Benefits**:
- Clear announcement source
- Appropriate department handling
- Organized communication flow

### 🔄 Transactional Emails

**Scenario**: Order confirmations with customer service replies

```typescript
{
  senderEmail: "orders@yourcompany.com",
  replyTo: "customerservice@yourcompany.com",
  subject: "Order Confirmation #{{orderNumber}}",
  recipients: [...]
}
```

**Benefits**:
- Clear transactional sender
- Customer service expertise
- Issue resolution focus

### 🎉 Event & Webinar Communications

**Scenario**: Event invitations with event team replies

```typescript
{
  senderEmail: "events@yourcompany.com",
  replyTo: "eventcoordinator@yourcompany.com",
  subject: "You're invited: {{eventName}} on {{eventDate}}",
  recipients: [...]
}
```

**Benefits**:
- Professional event branding
- Direct coordinator contact
- Event-specific support

### 📋 Survey & Feedback Requests

**Scenario**: Survey invitations with research team replies

```typescript
{
  senderEmail: "research@yourcompany.com",
  replyTo: "feedback@yourcompany.com",
  subject: "Help us improve: {{productName}} feedback request",
  recipients: [...]
}
```

**Benefits**:
- Research team credibility
- Dedicated feedback channel
- Quality assurance focus

## Best Practices

### ✅ Do's

1. **Always Use Monitored Addresses**
   ```typescript
   replyTo: "support@yourcompany.com" // ✅ Monitored inbox
   replyTo: "noreply@yourcompany.com" // ❌ Won't receive replies
   ```

2. **Match Reply-To with Email Purpose**
   - Marketing emails → Marketing team
   - Support emails → Support team
   - Sales emails → Sales representative

3. **Use Professional Email Addresses**
   ```typescript
   replyTo: "john.doe@yourcompany.com" // ✅ Professional
   replyTo: "johnny123@gmail.com"      // ❌ Unprofessional
   ```

4. **Consider Time Zones & Response Times**
   - Global teams: Use shared inboxes
   - Regional teams: Use local representatives
   - 24/7 support: Use support queues

5. **Implement Email Signatures**
   ```html
   <p>Best regards,<br>
   The Customer Success Team<br>
   Email: success@yourcompany.com<br>
   Phone: +1 (555) 123-4567</p>
   ```

### ❌ Don'ts

1. **Don't Use Unmonitored Addresses**
2. **Don't Mix Personal and Business Emails**
3. **Don't Forget to Test Reply Functionality**
4. **Don't Use Generic Addresses for Personal Communication**
5. **Don't Ignore Reply-To in Templates**

## Implementation Examples

### Basic Implementation

```typescript
import { SendBulkEmailDto } from './dto.send-email';

const marketingCampaign: SendBulkEmailDto = {
  recipients: [
    {
      recipientId: "507f1f77bcf86cd799439011",
      body: "<h1>Welcome {{firstName}}!</h1>",
      templateVars: { firstName: "John" }
    }
  ],
  providerId: "507f1f77bcf86cd799439012",
  senderEmail: "newsletter@company.com",
  replyTo: "marketing@company.com",
  subject: "Welcome to Our Community!",
  contentType: "html"
};
```

### Advanced Implementation with Template Variables

```typescript
const personalizedCampaign: SendBulkEmailDto = {
  recipients: [
    {
      recipientId: "507f1f77bcf86cd799439011",
      body: "<h1>Hi {{firstName}}</h1><p>Your account manager {{managerName}} will contact you.</p>",
      templateVars: { 
        firstName: "John",
        managerName: "Sarah Wilson",
        managerEmail: "sarah.wilson@company.com"
      }
    }
  ],
  providerId: "507f1f77bcf86cd799439012",
  senderEmail: "accounts@company.com",
  replyTo: "{{managerEmail}}", // Dynamic reply-to based on account manager
  subject: "Your Account Manager Introduction",
  contentType: "html"
};
```

### Frontend Integration

```jsx
// SendEmailDrawer.jsx
<TextInput
  label="Reply-To"
  placeholder="support@yourcompany.com"
  value={sendEmailForm.replyTo}
  onChange={(e) => setSendEmailForm(prev => ({ 
    ...prev, 
    replyTo: e.target.value 
  }))}
  description="Email address where replies will be sent (optional)"
  leftSection={<MdEmail size={16} />}
/>
```

## Common Patterns

### Pattern 1: Department Routing

```typescript
const departmentRouting = {
  sales: "sales@company.com",
  support: "support@company.com",
  billing: "billing@company.com",
  hr: "hr@company.com",
  marketing: "marketing@company.com"
};

// Usage
replyTo: departmentRouting.support
```

### Pattern 2: Role-Based Routing

```typescript
const roleBasedRouting = {
  customerSuccess: "success@company.com",
  technicalSupport: "tech@company.com",
  accountManager: "accounts@company.com",
  partnerships: "partners@company.com"
};
```

### Pattern 3: Campaign-Specific Routing

```typescript
const campaignRouting = {
  newsletter: "newsletter@company.com",
  promotions: "offers@company.com",
  events: "events@company.com",
  surveys: "feedback@company.com"
};
```

### Pattern 4: Dynamic Personal Routing

```typescript
// Based on recipient's account manager
const getPersonalReplyTo = (recipient) => {
  return recipient.accountManager 
    ? `${recipient.accountManager.email}`
    : "support@company.com";
};
```

## Advanced Configurations

### Multi-Language Support

```typescript
const multiLanguageReplyTo = {
  en: "support@company.com",
  es: "soporte@company.com",
  fr: "assistance@company.com",
  de: "support@company.de"
};

// Usage based on recipient's language preference
replyTo: multiLanguageReplyTo[recipient.language] || "support@company.com"
```

### Priority-Based Routing

```typescript
const priorityRouting = {
  vip: "vip-support@company.com",
  enterprise: "enterprise@company.com",
  standard: "support@company.com"
};

// Usage based on customer tier
replyTo: priorityRouting[customer.tier] || "support@company.com"
```

### Time-Based Routing

```typescript
const getTimeBasedReplyTo = () => {
  const hour = new Date().getHours();
  
  if (hour >= 9 && hour < 17) {
    return "business-hours@company.com";
  } else {
    return "after-hours@company.com";
  }
};
```

### Geographic Routing

```typescript
const geoRouting = {
  "US": "support-us@company.com",
  "EU": "support-eu@company.com", 
  "APAC": "support-apac@company.com"
};

// Usage based on recipient's region
replyTo: geoRouting[recipient.region] || "global-support@company.com"
```

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: Replies Going to Wrong Address
**Problem**: Recipients' replies are not reaching the intended inbox.

**Solution**:
```typescript
// Check reply-to field is properly set
console.log('Reply-To header:', emailData.replyTo);

// Verify email header in sent emails
headers: {
  'Reply-To': 'correct-address@company.com'
}
```

#### Issue 2: Reply-To Not Working in Some Email Clients
**Problem**: Some email clients ignore Reply-To header.

**Solution**:
```typescript
// Add both Reply-To and Return-Path headers
headers: {
  'Reply-To': 'support@company.com',
  'Return-Path': 'support@company.com'
}
```

#### Issue 3: Template Variables in Reply-To
**Problem**: Template variables not processing in Reply-To field.

**Solution**:
```typescript
// Process Reply-To field through template engine
const processedReplyTo = processTemplate(
  emailData.replyTo, 
  templateVariables, 
  emailRecord
);
```

#### Issue 4: Empty Reply-To Field
**Problem**: Reply-To field is empty or undefined.

**Solution**:
```typescript
// Fallback to sender email if Reply-To is empty
const finalReplyTo = emailData.replyTo || emailData.senderEmail;
```

### Testing Reply-To Functionality

```typescript
// Test script
const testReplyTo = async () => {
  const testEmail = {
    senderEmail: "test@company.com",
    replyTo: "replies@company.com",
    recipients: [{ 
      recipientId: "test-id",
      body: "Test message" 
    }],
    subject: "Reply-To Test"
  };
  
  // Send test email
  const result = await emailService.sendBulkEmails(testEmail);
  
  // Check email headers in result
  console.log('Email headers:', result.headers);
};
```

### Monitoring & Analytics

```typescript
// Track reply rates by department
const replyAnalytics = {
  support: { sent: 1000, replies: 250 },
  sales: { sent: 500, replies: 125 },
  marketing: { sent: 2000, replies: 100 }
};

// Calculate reply rates
const calculateReplyRate = (dept) => {
  const data = replyAnalytics[dept];
  return (data.replies / data.sent * 100).toFixed(2);
};
```

## Conclusion

The `replyTo` field is a powerful tool for creating professional, organized email communication workflows. By implementing the patterns and best practices outlined in this guide, you can:

- ✅ Improve customer experience
- ✅ Streamline team communication
- ✅ Maintain professional standards
- ✅ Enhance email deliverability
- ✅ Enable better tracking and analytics

Remember to always test your reply-to configurations and monitor their effectiveness to ensure optimal communication flow.

---

*For technical implementation details, see the [API Documentation](./API-DOCUMENTATION.md) and [Troubleshooting Guide](./TROUBLESHOOTING.md).* 