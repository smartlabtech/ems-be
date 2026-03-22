# Reply-To Quick Reference Card 🎯

## What is Reply-To?
Controls where recipient replies are sent when they click "Reply" - **independent of sender email address**.

## Basic Usage
```typescript
{
  senderEmail: "system@company.com",
  replyTo: "support@company.com",  // Replies go here
  recipients: [...]
}
```

## Common Patterns

| **Use Case** | **Sender Email** | **Reply-To** | **Purpose** |
|-------------|------------------|--------------|-------------|
| 📧 Marketing | `newsletter@company.com` | `marketing@company.com` | Team handles responses |
| 🛠️ Support | `noreply@company.com` | `support@company.com` | Clear "no-reply" sender |
| 💼 Sales | `campaigns@company.com` | `john.doe@company.com` | Personal touch |
| 🏢 HR | `announcements@company.com` | `hr@company.com` | Department routing |
| 🔄 Orders | `orders@company.com` | `customerservice@company.com` | Service expertise |

## Quick Do's & Don'ts

### ✅ DO
- Use **monitored email addresses**
- Match reply-to with **email purpose**
- Use **professional addresses**
- Test reply functionality

### ❌ DON'T  
- Use unmonitored addresses
- Mix personal/business emails
- Forget to test replies
- Use generic addresses for personal communication

## Frontend Integration
```jsx
<TextInput
  label="Reply-To"
  placeholder="support@yourcompany.com"
  value={sendEmailForm.replyTo}
  onChange={(e) => setSendEmailForm(prev => ({ 
    ...prev, 
    replyTo: e.target.value 
  }))}
  description="Email address where replies will be sent (optional)"
/>
```

## Department Routing Pattern
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

## Advanced: Dynamic Routing
```typescript
// VIP customers
const getReplyTo = (customer) => {
  if (customer.tier === 'vip') return 'vip-support@company.com';
  if (customer.region === 'EU') return 'support-eu@company.com';
  return 'support@company.com';
};
```

## Template Variables Support
```typescript
{
  replyTo: "{{managerEmail}}", // Dynamic based on account manager
  templateVars: {
    managerEmail: "sarah.wilson@company.com"
  }
}
```

## Troubleshooting

| **Problem** | **Solution** |
|-------------|--------------|
| Replies going to wrong address | Check `Reply-To` header in sent emails |
| Not working in some clients | Add both `Reply-To` and `Return-Path` headers |
| Template variables not processing | Process reply-to through template engine |
| Empty reply-to field | Fallback to sender email if empty |

## Testing
```typescript
// Quick test
const testReplyTo = {
  senderEmail: "test@company.com",
  replyTo: "replies@company.com",
  subject: "Reply-To Test",
  recipients: [{ recipientId: "test-id", body: "Test" }]
};
```

---
📚 **Full Documentation**: [REPLY-TO-GUIDE.md](./REPLY-TO-GUIDE.md) | [REPLY-TO-GUIDE.html](./REPLY-TO-GUIDE.html) 