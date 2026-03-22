# MXrouting Email Setup Guide

## Overview
This guide explains how to configure MXrouting SMTP for sending emails in the 2ZPoint application.

## Features Implemented

### 1. Email Service (`src/services/mailer.service.ts`)
- SMTP configuration with MXrouting
- Template-based email sending using Handlebars
- Support for attachments
- Connection verification

### 2. Email Types Supported
- **Email Verification**: Sent when users sign up
- **Password Reset**: Secure token-based password reset
- **Welcome Email**: Sent after successful registration
- **Invoice Email**: Sent with PDF attachments
- **Subscription Notifications**: For subscription updates
- **Project Invitations**: For team collaboration

### 3. Email Templates (`src/templates/emails/`)
- `email-verification.hbs`: Email verification template
- `password-reset.hbs`: Password reset template
- `welcome.hbs`: Welcome email template
- `invoice.hbs`: Invoice email template

## Configuration Steps

### 1. Get Your MXrouting Credentials
Log into your MXrouting account and obtain:
- SMTP server hostname (e.g., `mail.yourdomain.com`)
- SMTP username (usually your email address)
- SMTP password
- Preferred port (587 for TLS or 465 for SSL)

### 2. Update Environment Variables
Edit your `.env` file with your MXrouting credentials:

```env
# MXrouting SMTP Configuration
SMTP_HOST=mail.yourdomain.com        # Your MXrouting SMTP server
SMTP_PORT=587                        # Use 587 for TLS or 465 for SSL
SMTP_SECURE=false                    # false for 587/TLS, true for 465/SSL
SMTP_USER=noreply@yourdomain.com    # Your email address
SMTP_PASSWORD=your_password_here     # Your email password

# Email Settings
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=2ZPoint

# Frontend URLs for email links
EMAIL_VERIFICATION_URL=https://yourdomain.com/verify-email
PASSWORD_RESET_URL=https://yourdomain.com/reset-password
```

### 3. Test Your Configuration
Use the test endpoints to verify your setup:

```bash
# Test SMTP connection
curl -X GET http://localhost:3041/email-test/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send test email
curl -X POST http://localhost:3041/email-test/send-test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

## API Endpoints

### Authentication Endpoints

#### 1. Sign Up with Email Verification
```http
POST /:lang/auth/signup
```
- Automatically sends verification email
- Creates free subscription

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

### Invoice Email
```http
POST /:lang/invoices/:id/send
```
- Sends invoice email with PDF attachment

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify SMTP_HOST is correct
   - Check if port is open (587 or 465)
   - Ensure firewall allows outgoing SMTP

2. **Authentication Failed**
   - Double-check SMTP_USER and SMTP_PASSWORD
   - Ensure credentials are for MXrouting, not your domain registrar

3. **TLS/SSL Issues**
   - For port 587: Set SMTP_SECURE=false
   - For port 465: Set SMTP_SECURE=true
   - Try the opposite port if one doesn't work

4. **Emails Not Arriving**
   - Check spam/junk folders
   - Verify EMAIL_FROM domain matches your MXrouting domain
   - Ensure SPF, DKIM, and DMARC records are configured

### Testing Commands

```bash
# Test with telnet
telnet mail.yourdomain.com 587

# Test with openssl
openssl s_client -connect mail.yourdomain.com:587 -starttls smtp
```

## Security Best Practices

1. **Never commit credentials**: Keep `.env` file in `.gitignore`
2. **Use environment variables**: Never hardcode credentials
3. **Implement rate limiting**: Prevent email abuse
4. **Validate email addresses**: Before sending
5. **Use secure tokens**: For verification and password reset
6. **Set token expiration**: 24 hours for verification, 1 hour for password reset

## Email Templates Customization

To customize email templates, edit files in `src/templates/emails/`:

1. Templates use Handlebars syntax
2. Variables are passed from the service
3. Supports HTML and inline CSS
4. Test templates before deployment

Example customization:
```handlebars
<h1>{{appName}}</h1>
<p>Hello {{userName}},</p>
<p>Your custom message here...</p>
```

## Monitoring

Monitor email sending:
1. Check application logs for email errors
2. Track email delivery rates in MXrouting dashboard
3. Monitor bounce rates and complaints
4. Set up alerts for failed email sends

## Support

For MXrouting specific issues:
- MXrouting Support: https://mxroute.com/support
- Check MXrouting status: https://mxroutestatus.com/

For application issues:
- Check logs in the application
- Verify environment variables
- Test with the email test endpoints