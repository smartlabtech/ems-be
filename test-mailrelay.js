const axios = require('axios');
require('dotenv').config();

async function testMailrelay() {
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

  // Test API connectivity
  console.log('🔌 Testing API Connectivity...');
  console.log('-'.repeat(30));
  
  try {
    const testPayload = {
      from: {
        email: process.env.EMAIL_FROM || 'noreply@2zpoint.com',
        name: process.env.EMAIL_FROM_NAME || 'BrandBanda'
      },
      to: [{
        email: 'test@example.com',
        name: 'Test User'
      }],
      subject: 'API Test - Do Not Send',
      text_part: 'This is a connectivity test',
      smtp_tags: ['test', 'debug']
    };

    console.log('📤 Sending test request to:', process.env.MAILRELAY_API_URL);
    console.log('📧 From:', testPayload.from.email);
    console.log('🔐 Using auth token:', process.env.MAILRELAY_AUTH_TOKEN.substring(0, 10) + '...');
    
    const response = await axios.post(
      process.env.MAILRELAY_API_URL,
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': process.env.MAILRELAY_AUTH_TOKEN
        },
        timeout: 10000,
        validateStatus: () => true
      }
    );

    console.log(`\n📨 Response Status: ${response.status}`);
    console.log(`📝 Response Headers:`, response.headers);
    console.log(`📝 Response Data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.error('\n❌ Authentication failed!');
      console.error('💡 Solution: Check your MAILRELAY_AUTH_TOKEN');
    } else if (response.status === 400) {
      console.error('\n❌ Bad request!');
      console.error('💡 Check the error details above');
      if (response.data && response.data.error) {
        console.error('Error message:', response.data.error);
      }
    } else if (response.status === 200 || response.status === 201) {
      console.log('\n✅ API connection successful!');
    } else {
      console.log(`\n⚠️ Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error('\n❌ Connection failed!');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Cannot connect to Mailrelay API. Check your MAILRELAY_API_URL');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timed out. Check your network and API URL');
    } else if (error.response) {
      console.error('   Response error:', error.response.status);
      console.error('   Response data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
}

async function sendRealEmail(email) {
  if (!email || email === 'test') {
    console.log('\n💡 To send a real test email, run:');
    console.log('   node test-mailrelay.js your-email@example.com');
    return;
  }

  console.log('\n📧 Sending Real Test Email...');
  console.log('-'.repeat(30));

  try {
    const payload = {
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME
      },
      to: [{
        email: email,
        name: 'Test User'
      }],
      subject: `BrandBanda Test Email - ${new Date().toLocaleString()}`,
      html_part: `
        <h2>Test Email from BrandBanda</h2>
        <p>This is a test email sent via Mailrelay API.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p>If you received this, your email configuration is working!</p>
      `,
      text_part: `Test Email from BrandBanda\n\nThis is a test email sent via Mailrelay API.\nSent at: ${new Date().toISOString()}`,
      smtp_tags: ['test', 'manual']
    };

    console.log(`📤 Sending to: ${email}`);
    
    const response = await axios.post(
      process.env.MAILRELAY_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': process.env.MAILRELAY_AUTH_TOKEN
        }
      }
    );

    console.log('\n✅ Email sent successfully!');
    console.log('Response:', response.data);
    console.log(`\n✉️ Check your inbox at: ${email}`);
  } catch (error) {
    console.error('\n❌ Failed to send email!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Main
(async () => {
  console.clear();
  console.log('🚀 Mailrelay Email Service Debugger');
  console.log('='.repeat(50));
  
  await testMailrelay();
  
  const email = process.argv[2];
  if (email && email !== 'test') {
    await sendRealEmail(email);
  }
  
  console.log('\n✨ Debug complete!\n');
})();