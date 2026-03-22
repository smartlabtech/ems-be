# Email Service Provider API Documentation

## Bulk Email Sending Endpoint

### Overview
The bulk email sending endpoint allows you to send emails to multiple recipients using your configured email service providers. It supports batch processing, attachments, and various email formats. Recipients are specified using ME_email record IDs, ensuring proper tracking and management.

### Endpoint
```
POST /api/email-service-provider/send-bulk-emails
```

### Authentication
Requires Bearer token authentication.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipientIds` | string[] | Yes | Array of ME_email record IDs (max 1000) |
| `providerId` | string | Yes | MongoDB ID of the email service provider to use |
| `senderEmail` | string | Yes | Sender email address (must be configured in provider) |
| `subject` | string | Yes | Email subject line (max 200 characters) |
| `body` | string | Yes | Email content (HTML or plain text, max 500KB) |
| `contentType` | enum | Yes | Type of content: `html` or `text` |
| `cc` | string[] | No | Array of CC recipients (max 50) |
| `bcc` | string[] | No | Array of BCC recipients (max 50) |
| `replyTo` | string | No | Reply-to email address |
| `attachments` | object[] | No | Array of attachments (max 10) |
| `headers` | object | No | Custom email headers |
| `batchProcess` | boolean | No | Enable batch processing (default: true) |
| `batchSize` | number | No | Batch size (10-500, default: 100) |

#### Attachment Object Structure
```json
{
  "filename": "document.pdf",
  "content": "base64EncodedContent",
  "contentType": "application/pdf"
}
```

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "totalRecipients": 150,
  "successCount": 148,
  "failureCount": 2,
  "results": [
    {
      "email": "user@example.com",
      "success": true,
      "messageId": "msg_123456",
      "recordId": "60d21b4667d0d8992e610c85"
    },
    {
      "email": "invalid@example.com",
      "success": false,
      "error": "Invalid email address",
      "recordId": "60d21b4667d0d8992e610c86"
    }
  ],
  "batchInfo": {
    "totalBatches": 2,
    "processedBatches": 2,
    "batchSize": 100
  },
  "processingTime": 3542
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "No valid email records found for the provided IDs",
  "error": "Bad Request"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Email service provider with ID 60d21b4667d0d8992e610c85 not found or you don't have access to it",
  "error": "Not Found"
}
```

### Example Request

```bash
curl -X POST https://api.yourapp.com/api/email-service-provider/send-bulk-emails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientIds": [
      "60d21b4667d0d8992e610c85",
      "60d21b4667d0d8992e610c86",
      "60d21b4667d0d8992e610c87"
    ],
    "providerId": "60d21b4667d0d8992e610c88",
    "senderEmail": "noreply@company.com",
    "subject": "Welcome to Our Service!",
    "body": "<html><body><h1>Welcome!</h1><p>Thank you for joining us.</p></body></html>",
    "contentType": "html",
    "replyTo": "support@company.com",
    "batchProcess": true,
    "batchSize": 100
  }'
```

### Best Practices

1. **Email Record Management**: Ensure email records exist in ME_email collection before sending
2. **Batch Processing**: Always enable batch processing for lists larger than 100 recipients
3. **Rate Limiting**: The API automatically handles rate limiting based on your provider
4. **Error Handling**: Always check the `results` array to identify failed deliveries
5. **Sender Verification**: Ensure the sender email is verified with your provider
6. **Content Size**: Keep email content under 100KB for optimal delivery
7. **Attachments**: Limit attachments to 10MB total size
8. **Reply-To Configuration**: Use appropriate Reply-To addresses for better communication flow

### Reply-To Email Configuration

The `replyTo` field is a powerful feature that controls where recipient replies are directed. This is independent of the sender email and enables professional communication workflows.

**Common Use Cases:**
- **Marketing Campaigns**: Send from `newsletter@company.com`, replies to `marketing@company.com`
- **Support Notifications**: Send from `noreply@company.com`, replies to `support@company.com`
- **Sales Outreach**: Send from `campaigns@company.com`, replies to `sales.rep@company.com`

**Example:**
```json
{
  "senderEmail": "newsletter@company.com",
  "replyTo": "marketing@company.com",
  "subject": "Monthly Newsletter",
  ...
}
```

📚 **For comprehensive Reply-To documentation:**
- **[Complete Guide](./REPLY-TO-GUIDE.md)** - Detailed use cases and best practices
- **[HTML Guide](./REPLY-TO-GUIDE.html)** - Interactive web version
- **[Quick Reference](./REPLY-TO-QUICK-REFERENCE.md)** - Cheat sheet for developers

### Provider-Specific Limits

| Provider | Rate Limit | Recommended Batch Size |
|----------|------------|----------------------|
| SendGrid | 100/second | 100-500 |
| Mailgun | 300/hour (free) | 50-100 |
| SMTP | Varies | 50 or less |
| ERPNext | Server dependent | 50-100 |

### Common Use Cases

1. **Marketing Campaigns**: Send promotional emails to your tagged email lists
2. **Newsletters**: Distribute regular updates with attachments
3. **Transactional Emails**: Send order confirmations, password resets
4. **Notifications**: Alert users about important updates
5. **Event Invitations**: Send bulk invitations with calendar attachments

### Integration Example (JavaScript)

```javascript
async function sendMarketingCampaign() {
  // First, get email IDs from your ME_email collection based on tags or criteria
  const emailIds = await getEmailIdsByTags(['newsletter', 'active']);
  
  const campaign = {
    recipientIds: emailIds,
    providerId: process.env.EMAIL_PROVIDER_ID,
    senderEmail: 'marketing@company.com',
    subject: 'Special Offer - 20% Off!',
    body: await generateEmailTemplate(),
    contentType: 'html',
    headers: {
      'X-Campaign-ID': 'SUMMER2024'
    }
  };

  try {
    const response = await fetch('/api/email-service-provider/send-bulk-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(campaign)
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error(`Failed to send to ${result.failureCount} recipients`);
      
      // Update email status for failed sends
      const failedRecordIds = result.results
        .filter(r => !r.success)
        .map(r => r.recordId);
      await updateEmailStatus(failedRecordIds, 'failed');
    }
    
    return result;
  } catch (error) {
    console.error('Campaign send failed:', error);
    throw error;
  }
}
```

### Security Considerations

1. **Authentication**: All requests must include a valid JWT token
2. **Authorization**: Users can only send to their own email records
3. **Input Validation**: All inputs are validated to prevent injection attacks
4. **Rate Limiting**: Built-in protection against abuse
5. **Logging**: All email sends are logged for audit purposes with record IDs

### Troubleshooting

**Common Issues:**

1. **"No valid email records found"**: Verify the email IDs exist and belong to your account
2. **"Sender email not configured"**: Verify the sender email in your provider settings
3. **"Provider not active"**: Check that your provider status is ACTIVE
4. **"Invalid recipient ID"**: Ensure all IDs are valid MongoDB ObjectIDs
5. **Rate limit errors**: Reduce batch size or add delays between requests 