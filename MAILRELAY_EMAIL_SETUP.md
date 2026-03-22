# Mailrelay.com Email Setup Guide

## Overview
This guide explains how to configure Mailrelay.com API for sending emails in the 2ZPoint application.

## What is Mailrelay?
Mailrelay is a professional email marketing and transactional email service that provides:
- High deliverability rates
- RESTful API for transactional emails
- Email tracking and analytics
- SMTP tags for email categorization
- Support for attachments

## Features Implemented

### 1. Email Service (`src/services/mailrelay.service.ts`)
- HTTP API integration with Mailrelay
- Template-based email sending using Handlebars
- Support for attachments (Base64 encoded)
- Email tagging for categorization
- Connection verification
- Auto HTML-to-text conversion

### 2. Email Types Supported
- **Email Verification**: Sent when users sign up (tagged: 'verification', 'signup')
- **Password Reset**: Secure token-based password reset (tagged: 'password-reset')
- **Welcome Email**: Sent after successful registration (tagged: 'welcome', 'onboarding')
- **Invoice Email**: Sent with PDF attachments (tagged: 'invoice', 'billing')
- **Subscription Notifications**: For subscription updates (tagged: 'subscription')
- **Project Invitations**: For team collaboration (tagged: 'invitation', 'project')

### 3. Email Templates (`src/templates/emails/`)
- `email-verification.hbs`: Email verification template
- `password-reset.hbs`: Password reset template
- `welcome.hbs`: Welcome email template
- `invoice.hbs`: Invoice email template

## Configuration Steps

### 1. Get Your Mailrelay Credentials

1. Log into your Mailrelay account at https://app.mailrelay.com
2. Navigate to **Settings** → **API Keys**
3. Generate a new API key or copy your existing one
4. Note your subdomain (e.g., if your Mailrelay URL is `https://mycompany.ipzmarketing.com`, your subdomain is `mycompany`)

### 2. Verify Your Sender Domain

1. In Mailrelay dashboard, go to **Settings** → **Sender Domains**
2. Add and verify your domain
3. Configure SPF, DKIM, and DMARC records as instructed

### 3. Update Environment Variables

Edit your `.env` file with your Mailrelay credentials:

```env
# Mailrelay.com API Configuration
MAILRELAY_API_URL=https://YOUR_SUBDOMAIN.ipzmarketing.com/api/v1/send_emails
MAILRELAY_AUTH_TOKEN=your_mailrelay_auth_token_here

# Email Settings
EMAIL_FROM=noreply@yourdomain.com  # Must be from a verified domain
EMAIL_FROM_NAME=2ZPoint

# Frontend URLs for email links
EMAIL_VERIFICATION_URL=https://yourdomain.com/verify-email
PASSWORD_RESET_URL=https://yourdomain.com/reset-password
APP_URL=https://yourdomain.com
```

### 4. Test Your Configuration

Use the test endpoints to verify your setup:

```bash
# Test Mailrelay API connection
curl -X GET http://localhost:3041/mailrelay-test/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send test email
curl -X POST http://localhost:3041/mailrelay-test/send-test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "recipient@example.com", "tags": ["test", "api"]}'

# Send test email with attachment
curl -X POST http://localhost:3041/mailrelay-test/test-with-attachment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Endpoints

### Authentication Endpoints

#### 1. Sign Up with Email Verification
```http
POST /:lang/auth/signup
```
- Automatically sends verification email via Mailrelay
- Creates free subscription
- Tags: ['verification', 'signup']

#### 2. Verify Email
```http
GET /:lang/auth/verify-email/:token
```
- Verifies email using the token from email

#### 3. Request Password Reset
```http
GET /:lang/auth/forgot-password/:email
```
- Sends password reset email with secure token
- Tags: ['password-reset']

#### 4. Reset Password with Token
```http
POST /:lang/auth/reset-password
Body: {
  "token": "reset_token_from_email",
  "newPassword": "new_secure_password"
}
```

#### 5. Resend Verification Email
```http
POST /:lang/auth/resend-verification
```
- Requires authentication
- Resends verification email to logged-in user
- Tags: ['verification', 'signup']

### Invoice Email
```http
POST /:lang/invoices/:id/send
```
- Sends invoice email with PDF attachment
- Tags: ['invoice', 'billing']

## Mailrelay API Features Used

### 1. Email Tagging
All emails are tagged for better organization and tracking:
```javascript
smtp_tags: ['verification', 'signup']  // Example tags
```

### 2. Attachments
Supports Base64 encoded attachments:
```javascript
attachments: [{
  content: "base64_encoded_content",
  file_name: "invoice.pdf",
  content_type: "application/pdf",
  content_id: ""  // Optional for inline attachments
}]
```

### 3. Auto Text Generation
When only HTML is provided, Mailrelay can auto-generate text version:
```javascript
text_part_auto: true
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Verify your `MAILRELAY_AUTH_TOKEN` is correct
   - Check if the API key is active in Mailrelay dashboard
   - Ensure the API key has necessary permissions

2. **400 Bad Request**
   - Verify sender email is from a verified domain
   - Check recipient email format
   - Ensure required fields are present

3. **Domain Not Verified**
   - Go to Mailrelay dashboard → Settings → Sender Domains
   - Complete domain verification process
   - Wait for DNS propagation (can take up to 48 hours)

4. **Emails Not Arriving**
   - Check Mailrelay dashboard for delivery status
   - Verify recipient email is correct
   - Check spam/junk folders
   - Review Mailrelay logs for bounces or blocks

### Testing with cURL

Test the Mailrelay API directly:

```bash
# Basic test
curl --request POST \
  --url https://YOUR_SUBDOMAIN.ipzmarketing.com/api/v1/send_emails \
  --header 'content-type: application/json' \
  --header 'x-auth-token: YOUR_AUTH_TOKEN' \
  --data '{
    "from": {"email": "sender@yourdomain.com", "name": "Test Sender"},
    "to": [{"email": "recipient@example.com", "name": "Test Recipient"}],
    "subject": "Test Email",
    "text_part": "This is a test email from Mailrelay API"
  }'
```

## Monitoring and Analytics

### Mailrelay Dashboard
Monitor your emails at: https://app.mailrelay.com

Key metrics to track:
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Spam complaints

### Email Tags Analytics
Use tags to segment and analyze email performance:
- `verification` - Track signup verification rates
- `password-reset` - Monitor password reset requests
- `invoice` - Track billing email engagement
- `welcome` - Measure onboarding email effectiveness

## Security Best Practices

1. **Protect API Credentials**
   - Never commit `MAILRELAY_AUTH_TOKEN` to version control
   - Use environment variables only
   - Rotate API keys periodically

2. **Domain Security**
   - Configure SPF records
   - Set up DKIM signing
   - Implement DMARC policy

3. **Rate Limiting**
   - Implement rate limiting for email endpoints
   - Monitor for unusual sending patterns
   - Set daily/hourly sending limits in Mailrelay

4. **Token Security**
   - Use secure random tokens for verification/reset
   - Set appropriate expiration times
   - Invalidate tokens after use

## API Rate Limits

Mailrelay API limits (may vary by plan):
- Requests per second: Check your plan
- Daily email limit: Check your plan
- Attachment size: Usually 10MB max
- Recipients per request: Usually 50 max

## Migration from SMTP to Mailrelay API

Advantages of using Mailrelay API over SMTP:
- Better deliverability tracking
- Email tagging and categorization
- Detailed analytics
- Faster sending
- Better error handling
- No SMTP authentication issues

## Support

For Mailrelay specific issues:
- Mailrelay Support: https://mailrelay.com/en/support
- API Documentation: https://mailrelay.com/en/api-documentation
- Status Page: Check Mailrelay status page

For application issues:
- Check application logs for API errors
- Verify environment variables
- Test with the mailrelay-test endpoints
- Review this documentation

## Cost Optimization

Tips for optimizing Mailrelay usage:
1. Use tags to track and optimize email types
2. Monitor bounce rates and clean email lists
3. Implement proper email validation before sending
4. Use templates to reduce API payload size
5. Batch similar emails when possible