import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function testMailrelayConnection() {
  console.log('🔍 Testing Mailrelay Email Service\n');
  console.log('='.repeat(50));
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`   API URL: ${process.env.MAILRELAY_API_URL || '❌ NOT SET'}`);
  console.log(`   Auth Token: ${process.env.MAILRELAY_AUTH_TOKEN ? '✅ Set (hidden)' : '❌ NOT SET'}`);
  console.log(`   From Email: ${process.env.EMAIL_FROM || '❌ NOT SET'}`);
  console.log(`   From Name: ${process.env.EMAIL_FROM_NAME || '❌ NOT SET'}`);
  console.log('');

  if (!process.env.MAILRELAY_API_URL || !process.env.MAILRELAY_AUTH_TOKEN) {
    console.error('❌ Missing required environment variables!');
    return;
  }

  // Test 1: Check API connectivity
  console.log('🔌 Test 1: API Connectivity');
  console.log('-'.repeat(30));
  
  try {
    const testPayload = {
      from: {
        email: process.env.EMAIL_FROM || 'test@example.com',
        name: process.env.EMAIL_FROM_NAME || 'Test'
      },
      to: [{
        email: 'test@example.com',
        name: 'Test User'
      }],
      subject: 'API Test - Do Not Send',
      text_part: 'This is a test',
      smtp_tags: ['test', 'debug']
    };

    console.log('📤 Sending test request to:', process.env.MAILRELAY_API_URL);
    console.log('📧 From:', testPayload.from.email);
    
    const response = await axios.post(
      process.env.MAILRELAY_API_URL,
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': process.env.MAILRELAY_AUTH_TOKEN
        },
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status
      }
    );

    console.log(`📨 Response Status: ${response.status}`);
    console.log(`📝 Response Data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.error('❌ Authentication failed! Check your MAILRELAY_AUTH_TOKEN');
    } else if (response.status === 400) {
      console.error('❌ Bad request! Check the error details above');
    } else if (response.status === 200 || response.status === 201) {
      console.log('✅ API connection successful!');
    } else {
      console.log(`⚠️ Unexpected status code: ${response.status}`);
    }
  } catch (error: any) {
    console.error('❌ Connection failed!');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Cannot connect to Mailrelay API. Check your MAILRELAY_API_URL');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timed out. Check your network and API URL');
    } else {
      console.error('   Error:', error.message);
    }
    console.error('   Full error:', error);
  }

  console.log('\n' + '='.repeat(50));
}

async function sendTestEmail(recipientEmail: string) {
  console.log('\n📧 Test 2: Send Real Email');
  console.log('-'.repeat(30));

  if (!recipientEmail || recipientEmail === 'your-email@example.com') {
    console.error('❌ Please provide a valid recipient email address');
    console.log('   Usage: npm run test:mailrelay -- your-email@example.com');
    return;
  }

  try {
    const emailPayload = {
      from: {
        email: process.env.EMAIL_FROM || 'noreply@2zpoint.com',
        name: process.env.EMAIL_FROM_NAME || 'BrandBanda'
      },
      to: [{
        email: recipientEmail,
        name: 'Test Recipient'
      }],
      subject: `Test Email from BrandBanda - ${new Date().toLocaleString()}`,
      html_part: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BrandBanda Email Test</h1>
            </div>
            <div class="content">
              <h2>Test Email Successfully Sent!</h2>
              <p>This is a test email sent via Mailrelay API to verify the email configuration.</p>
              <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
              <p><strong>Configuration:</strong></p>
              <ul>
                <li>API URL: ${process.env.MAILRELAY_API_URL}</li>
                <li>From: ${process.env.EMAIL_FROM}</li>
                <li>Environment: ${process.env.NODE_ENV}</li>
              </ul>
            </div>
            <div class="footer">
              <p>This is an automated test email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text_part: `BrandBanda Email Test\n\nThis is a test email sent via Mailrelay API.\n\nSent at: ${new Date().toISOString()}`,
      smtp_tags: ['test', 'debug', 'mailrelay']
    };

    console.log(`📤 Sending email to: ${recipientEmail}`);
    console.log(`📧 From: ${emailPayload.from.email} (${emailPayload.from.name})`);
    console.log(`📝 Subject: ${emailPayload.subject}`);

    const response = await axios.post(
      process.env.MAILRELAY_API_URL!,
      emailPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': process.env.MAILRELAY_AUTH_TOKEN
        },
        timeout: 30000
      }
    );

    console.log('\n✅ Email sent successfully!');
    console.log(`📨 Response Status: ${response.status}`);
    console.log(`📝 Response Data:`, JSON.stringify(response.data, null, 2));
    console.log(`\n✉️ Check your inbox at: ${recipientEmail}`);
    
  } catch (error: any) {
    console.error('\n❌ Failed to send email!');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error Data:`, JSON.stringify(error.response.data, null, 2));
      
      // Provide specific guidance based on error
      if (error.response.status === 401) {
        console.error('\n💡 Solution: Check your MAILRELAY_AUTH_TOKEN in .env file');
      } else if (error.response.status === 400) {
        console.error('\n💡 Possible issues:');
        console.error('   - Sender email not verified in Mailrelay');
        console.error('   - Invalid email format');
        console.error('   - Missing required fields');
      } else if (error.response.status === 403) {
        console.error('\n💡 Solution: Your account may not have permission to send emails');
      }
    } else if (error.request) {
      console.error('   No response received from Mailrelay');
      console.error('\n💡 Possible issues:');
      console.error('   - Check your internet connection');
      console.error('   - Verify MAILRELAY_API_URL is correct');
      console.error('   - Check if Mailrelay service is operational');
    } else {
      console.error('   Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
}

// Main execution
async function main() {
  console.clear();
  console.log('🚀 Mailrelay Email Service Debugger');
  console.log('='.repeat(50));
  
  // First test connection
  await testMailrelayConnection();
  
  // If user provided email, send test email
  const recipientEmail = process.argv[2];
  if (recipientEmail && recipientEmail !== 'test') {
    await sendTestEmail(recipientEmail);
  } else {
    console.log('\n💡 To send a test email, run:');
    console.log('   npx ts-node src/scripts/test-mailrelay.ts your-email@example.com');
  }
  
  console.log('\n✨ Debug session complete!\n');
}

// Run the script
main().catch(console.error);