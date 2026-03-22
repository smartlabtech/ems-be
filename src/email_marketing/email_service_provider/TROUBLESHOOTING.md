# ERPNext Email Service Provider Troubleshooting Guide

## Common Error: "Could not find Email Account"

### Error Message
```
frappe.exceptions.LinkValidationError: Could not find Email Account: support@2zpoint.com
```

### Cause
This error occurs when ERPNext cannot find an Email Account record that matches the sender email address. In ERPNext, emails are sent through configured Email Accounts, which must be set up before sending emails.

### Solution

#### 1. Create Email Account in ERPNext

First, ensure that an Email Account exists in ERPNext for the sender email:

1. Log into your ERPNext instance
2. Navigate to **Email > Email Account**
3. Click **New** to create a new Email Account
4. Fill in the required fields:
   - **Email Account Name**: Give it a descriptive name (e.g., "Support Email")
   - **Email Address**: Enter the sender email (e.g., "support@2zpoint.com")
   - **Enable Outgoing**: Check this box
   - **SMTP Server**: Enter your SMTP server details
   - **SMTP Port**: Usually 587 for TLS or 465 for SSL
   - **Use TLS/SSL**: Check appropriate option
   - **Login ID**: Your email login (often same as email address)
   - **Password**: Your email password
5. Save the Email Account

#### 2. Verify Email Account Configuration

Test the email account in ERPNext:
1. In the Email Account document, click **Test Connection**
2. If successful, try sending a test email

#### 3. Refresh Email Accounts in 2ZPoint

After creating the Email Account in ERPNext:

1. Go to your Email Service Provider in 2ZPoint
2. Click **Test Configuration** - this will fetch the latest email accounts
3. The new email account should now appear in the list

#### 4. Use the Correct Sender Email

When sending bulk emails:
- Ensure the `senderEmail` field matches exactly with an email configured in ERPNext
- Email addresses are case-sensitive in some systems

### Alternative Solution: Default Email Account

If you want ERPNext to use a default email account:

1. In ERPNext, go to **Settings > Email Domain**
2. Set up a default outgoing email account
3. In your API calls, omit the `email_account` field to use the default

### Code Fix Applied

The system has been updated to:
1. Use the correct ERPNext email API endpoint: `/api/method/frappe.core.doctype.communication.email.make`
2. Send the payload in the exact format ERPNext expects
3. Include required fields: `communication_doctype` and `communication_name`
4. Handle ERPNext-specific error responses

### Working Payload Format

ERPNext expects emails to be sent with this specific payload structure:

```json
{
  "recipients": "customer@example.com",
  "subject": "Your Email Subject",
  "content": "Your email content here",
  "communication_doctype": "User",
  "communication_name": "Administrator",
  "send_email": true,
  "content_type": "text",
  "sender": "support@2zpoint.com"
}
```

For HTML emails, change `content_type` to `"html"`.

### Example Working Configuration

```json
{
  "name": "Support Email Account",
  "email_id": "support@2zpoint.com",
  "enable_outgoing": 1,
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "use_tls": 1,
  "login_id": "support@2zpoint.com",
  "password": "your-app-password"
}
```

### API Endpoints

The correct endpoint for sending emails in ERPNext is:
```
POST /api/method/frappe.core.doctype.communication.email.make
```

Not:
- ❌ `/api/resource/Communication`
- ❌ `/api/resource/Email`

### Debugging Steps

1. **Check Email Accounts List**:
   ```bash
   GET https://your-erpnext.com/api/resource/Email Account
   ```

2. **Verify Specific Account**:
   ```bash
   GET https://your-erpnext.com/api/resource/Email Account/Support%20Email%20Account
   ```

3. **Test Email Sending Directly**:
   ```bash
   POST https://your-erpnext.com/api/method/frappe.core.doctype.communication.email.make
   Content-Type: application/json
   Authorization: token your-api-key:your-api-secret
   
   {
     "recipients": "test@example.com",
     "subject": "Test Email",
     "content": "This is a test",
     "communication_doctype": "User",
     "communication_name": "Administrator",
     "send_email": true,
     "content_type": "text",
     "sender": "support@2zpoint.com"
   }
   ```

### Common Issues

1. **Email Account Disabled**: Ensure "Enable Outgoing" is checked
2. **Wrong Credentials**: Verify SMTP credentials are correct
3. **Permission Issues**: User must have permission to use the Email Account
4. **API Token Permissions**: Ensure API token has access to Email Account doctype
5. **Wrong API Endpoint**: Use `/api/method/frappe.core.doctype.communication.email.make`
6. **Missing Required Fields**: Always include `communication_doctype` and `communication_name`

### Need More Help?

If the issue persists:
1. Check ERPNext error logs: **Settings > Error Log**
2. Verify API permissions for your token
3. Test with a simple email first before bulk sending
4. Check ERPNext version compatibility - this API works with ERPNext v13+ 