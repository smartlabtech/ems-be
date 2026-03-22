# Direct Email Mode Documentation

## Overview

The email service now supports two modes for sending bulk emails:

1. **Database Mode** (`recipientId`) - Traditional mode with full tracking and validation
2. **Direct Mode** (`recipient`) - New mode for sending to any email without database requirements

## Key Differences

| Feature | Database Mode | Direct Mode |
|---------|--------------|-------------|
| Recipient Validation | ✅ Must exist in ME_email collection | ❌ No validation required |
| Message Tracking | ✅ Saved in ME_message collection | ❌ Not saved |
| Email List Storage | ✅ Must be in email list | ❌ Not added to email list |
| Template Variables | All fields available | Only `{{email}}` and custom vars |
| Audit Trail | Full tracking | Only in response |

## API Usage

### 1. Database Mode (Existing)
```json
POST /api/email-marketing/email-service-provider/send-bulk-emails
{
  "recipients": [{
    "recipientId": "60d21b4667d0d8992e610c85",
    "body": "Hello {{firstName}} {{lastName}}!",
    "subject": "Welcome {{firstName}}!",
    "templateVars": {
      "customField": "value"
    }
  }],
  "providerId": "provider-id",
  "senderEmail": "noreply@company.com",
  "subject": "Default Subject",
  "contentType": "html"
}
```

### 2. Direct Mode (New)
```json
POST /api/email-marketing/email-service-provider/send-bulk-emails
{
  "recipients": [{
    "recipient": "external@example.com",
    "body": "Hello! This email is being sent to {{email}}",
    "subject": "Direct Email Test",
    "templateVars": {
      "name": "John Doe",
      "company": "External Corp"
    }
  }],
  "providerId": "provider-id",
  "senderEmail": "noreply@company.com",
  "subject": "Default Subject",
  "contentType": "html"
}
```

### 3. Mixed Mode
```json
POST /api/email-marketing/email-service-provider/send-bulk-emails
{
  "recipients": [
    {
      "recipientId": "60d21b4667d0d8992e610c85",
      "body": "Hello {{firstName}}! (Database recipient)"
    },
    {
      "recipient": "new@external.com",
      "body": "Hello {{name}}! (Direct recipient)",
      "templateVars": { "name": "External User" }
    }
  ],
  "providerId": "provider-id",
  "senderEmail": "noreply@company.com",
  "subject": "Mixed Mode Email",
  "contentType": "html"
}
```

## Template Variables

### Database Mode Variables
- `{{firstName}}` - From ME_email record
- `{{lastName}}` - From ME_email record  
- `{{email}}` - From ME_email record
- `{{mobile}}` - From ME_email record
- `{{whatsapp}}` - From ME_email record
- Any custom variables in `templateVars`

### Direct Mode Variables
- `{{email}}` - The recipient email address
- Any custom variables in `templateVars`
- **Note**: firstName, lastName, mobile, whatsapp are NOT available

## Response Format

The response now includes a `mode` field for each recipient:

```json
{
  "success": true,
  "totalRecipients": 3,
  "successCount": 3,
  "failureCount": 0,
  "results": [
    {
      "email": "user@company.com",
      "success": true,
      "messageId": "msg_123",
      "recordId": "60d21b4667d0d8992e610c85",
      "mode": "database"  // Tracked in database
    },
    {
      "email": "external@example.com",
      "success": true,
      "messageId": "msg_124",
      "recordId": "direct_1234567890_0",
      "mode": "direct"    // Not tracked
    }
  ],
  "processingTime": 2500
}
```

## Use Cases

### When to Use Database Mode
- Marketing campaigns to existing subscribers
- Newsletters to registered users
- When you need message history
- When you need to track opens/clicks
- When recipients are already in your database

### When to Use Direct Mode
- One-time notifications to external users
- Transactional emails to non-subscribers
- Event invitations to mixed audiences
- When you don't want to pollute your email list
- Quick tests without database setup

## Validation Rules

1. **Each recipient must have EITHER `recipientId` OR `recipient`, not both**
   ```json
   // ❌ Invalid - has both
   {
     "recipientId": "123",
     "recipient": "user@example.com"
   }
   
   // ❌ Invalid - has neither
   {
     "body": "Hello"
   }
   
   // ✅ Valid - has recipientId
   {
     "recipientId": "123",
     "body": "Hello"
   }
   
   // ✅ Valid - has recipient
   {
     "recipient": "user@example.com",
     "body": "Hello"
   }
   ```

2. **Direct mode emails must be valid email addresses**
3. **Database mode IDs must be valid MongoDB ObjectIds**
4. **Body content is always required**

## Important Notes

### No Message History for Direct Mode
Direct mode emails are NOT saved in the ME_message collection. If you need to track sent emails, use database mode.

### No Duplicate Prevention
Direct mode doesn't check if an email was already sent to a recipient. The same email address can receive multiple messages.

### Performance Considerations
- Direct mode is slightly faster (no database lookups)
- Mixed mode processes both types in the same batch
- Batching works the same for both modes

### Security Considerations
- Direct mode still requires authentication
- Provider must belong to the authenticated user
- All emails are sent through configured providers

## Error Handling

### Database Mode Errors
- "No valid email records found" - recipientId doesn't exist
- "Email doesn't belong to user" - security violation

### Direct Mode Errors
- "Invalid email address" - malformed email
- Standard provider errors (rate limits, etc.)

### Mixed Mode Behavior
- Each recipient is processed independently
- Database validation failures don't affect direct recipients
- Results show which mode each email used

## Frontend Implementation

```javascript
// Sending to known subscribers
const databaseRecipients = subscribers.map(sub => ({
  recipientId: sub.id,
  body: emailTemplate,
  templateVars: { 
    discount: "20%",
    expiryDate: "Dec 31, 2024"
  }
}));

// Sending to external emails  
const directRecipients = externalEmails.map(email => ({
  recipient: email,
  body: emailTemplate.replace(/{{firstName}}/g, ''), // Remove unavailable vars
  templateVars: {
    company: "Your Company"
  }
}));

// Combine and send
const response = await api.sendBulkEmails({
  recipients: [...databaseRecipients, ...directRecipients],
  providerId: selectedProvider.id,
  senderEmail: "campaigns@company.com",
  subject: "Special Offer",
  contentType: "html"
});

// Check results by mode
const dbResults = response.results.filter(r => r.mode === 'database');
const directResults = response.results.filter(r => r.mode === 'direct');
```

## Migration Guide

Existing integrations continue to work without changes. To use direct mode:

1. Update recipient objects to use `recipient` instead of `recipientId`
2. Remove template variables that aren't available (firstName, etc.)
3. Handle the lack of message history in your application logic
4. Test thoroughly with mixed mode before full deployment 