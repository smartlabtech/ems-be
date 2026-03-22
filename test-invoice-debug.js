#!/usr/bin/env node

/**
 * Debug script to test invoice email sending with comprehensive logging
 * 
 * Usage:
 *   node test-invoice-debug.js <invoiceId> <userEmail>
 * 
 * Example:
 *   node test-invoice-debug.js 6123456789abcdef01234567 user@example.com
 */

require('dotenv').config();
const axios = require('axios');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80));
}

async function debugInvoiceEmail() {
  const invoiceId = process.argv[2];
  const userEmail = process.argv[3];
  const apiUrl = process.env.APP_URL || 'http://localhost:3000';
  
  if (!invoiceId || !userEmail) {
    log('❌ Usage: node test-invoice-debug.js <invoiceId> <userEmail>', 'red');
    process.exit(1);
  }

  logSection('🔍 INVOICE EMAIL DEBUG TOOL');
  
  // Step 1: Check environment variables
  log('\n📋 STEP 1: Checking Environment Variables...', 'cyan');
  const requiredEnvVars = [
    'MAILRELAY_API_URL',
    'MAILRELAY_AUTH_TOKEN',
    'EMAIL_FROM',
    'EMAIL_FROM_NAME'
  ];
  
  let envVarsOk = true;
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log(`  ✅ ${varName}: ${value.substring(0, 20)}...`, 'green');
    } else {
      log(`  ❌ ${varName}: NOT SET`, 'red');
      envVarsOk = false;
    }
  });
  
  if (!envVarsOk) {
    log('\n❌ Missing required environment variables!', 'red');
    log('Please check your .env file and ensure all required variables are set.', 'yellow');
    process.exit(1);
  }
  
  // Step 2: Test Mailrelay connection
  log('\n📋 STEP 2: Testing Mailrelay Connection...', 'cyan');
  try {
    const testResponse = await axios.post(
      process.env.MAILRELAY_API_URL,
      {
        from: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME },
        to: [{ email: 'test@example.com', name: 'Test' }],
        subject: 'Connection Test',
        text_part: 'Test',
        smtp_tags: ['test']
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': process.env.MAILRELAY_AUTH_TOKEN
        },
        validateStatus: (status) => true // Don't throw on any status
      }
    );
    
    if (testResponse.status === 401) {
      log('  ❌ Authentication failed - Invalid auth token', 'red');
      process.exit(1);
    } else if (testResponse.status === 422) {
      log('  ✅ Mailrelay connection successful (validation error expected for test email)', 'green');
    } else if (testResponse.status === 200 || testResponse.status === 201) {
      log('  ✅ Mailrelay connection successful', 'green');
    } else {
      log(`  ⚠️ Unexpected status: ${testResponse.status}`, 'yellow');
    }
  } catch (error) {
    log(`  ❌ Connection failed: ${error.message}`, 'red');
    process.exit(1);
  }
  
  // Step 3: Simulate invoice email sending
  log('\n📋 STEP 3: Simulating Invoice Email Send...', 'cyan');
  log(`  Invoice ID: ${invoiceId}`, 'blue');
  log(`  User Email: ${userEmail}`, 'blue');
  
  // Create a mock invoice for testing
  const mockInvoice = {
    _id: invoiceId,
    invoiceNumber: 'INV-2025-0001',
    status: 'draft',
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    currency: 'USD',
    subtotal: 100.00,
    tax: 5.00,
    taxRate: 0.05,
    total: 105.00,
    amountDue: 105.00,
    amountPaid: 0,
    billingDetails: {
      firstName: 'Test',
      lastName: 'User',
      email: userEmail,
      phone: '+971501234567',
      address: '123 Test Street',
      city: 'Dubai',
      country: 'UAE'
    },
    items: [
      {
        description: 'Test Service',
        quantity: 1,
        unitPrice: 100.00,
        totalPrice: 100.00,
        taxAmount: 5.00
      }
    ]
  };
  
  // Prepare invoice data for email
  const invoiceData = {
    invoiceNumber: mockInvoice.invoiceNumber,
    invoiceDate: new Date(mockInvoice.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    dueDate: new Date(mockInvoice.dueDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    customerName: `${mockInvoice.billingDetails.firstName} ${mockInvoice.billingDetails.lastName}`,
    customerEmail: mockInvoice.billingDetails.email,
    customerAddress: mockInvoice.billingDetails.address,
    billingDetails: mockInvoice.billingDetails,
    items: mockInvoice.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      amount: item.totalPrice.toFixed(2),
      currency: mockInvoice.currency
    })),
    currency: mockInvoice.currency,
    subtotal: mockInvoice.subtotal.toFixed(2),
    tax: mockInvoice.tax.toFixed(2),
    taxRate: (mockInvoice.taxRate * 100).toFixed(0),
    total: mockInvoice.total.toFixed(2),
    amountDue: mockInvoice.amountDue.toFixed(2),
    status: mockInvoice.status,
    attachments: [] // No PDF for this test
  };
  
  log('\n  📧 Sending test invoice email...', 'yellow');
  
  // Step 4: Send the actual email
  try {
    const emailPayload = {
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME || 'BrandBanda'
      },
      to: [{
        email: userEmail,
        name: invoiceData.customerName
      }],
      subject: `Invoice #${invoiceData.invoiceNumber} - BrandBanda`,
      html_part: generateInvoiceHTML(invoiceData),
      text_part: generateInvoiceText(invoiceData),
      smtp_tags: ['invoice', 'billing', 'test']
    };
    
    log('\n  📤 Sending to Mailrelay API...', 'yellow');
    log(`    URL: ${process.env.MAILRELAY_API_URL}`, 'blue');
    log(`    To: ${userEmail}`, 'blue');
    log(`    Subject: ${emailPayload.subject}`, 'blue');
    
    const response = await axios.post(
      process.env.MAILRELAY_API_URL,
      emailPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': process.env.MAILRELAY_AUTH_TOKEN
        },
        timeout: 30000
      }
    );
    
    if (response.status === 200 || response.status === 201) {
      log('\n  ✅ EMAIL SENT SUCCESSFULLY!', 'green');
      log(`    Status: ${response.status}`, 'green');
      log(`    Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log(`\n  ❌ Unexpected response status: ${response.status}`, 'red');
      log(`    Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    }
  } catch (error) {
    log('\n  ❌ EMAIL SEND FAILED!', 'red');
    if (error.response) {
      log(`    Status: ${error.response.status}`, 'red');
      log(`    Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      
      if (error.response.status === 401) {
        log('\n  🔒 Authentication Error: Check your MAILRELAY_AUTH_TOKEN', 'red');
      } else if (error.response.status === 422) {
        log('\n  📝 Validation Error: Check email addresses and data format', 'red');
        if (error.response.data.errors) {
          Object.keys(error.response.data.errors).forEach(field => {
            log(`    - ${field}: ${error.response.data.errors[field].join(', ')}`, 'yellow');
          });
        }
      }
    } else if (error.request) {
      log('    No response received from Mailrelay', 'red');
      log(`    Error: ${error.message}`, 'red');
    } else {
      log(`    Error: ${error.message}`, 'red');
    }
  }
  
  logSection('📊 DEBUG SESSION COMPLETE');
}

function generateInvoiceHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${data.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .invoice-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    .items-table th { background: #f0f0f0; font-weight: bold; }
    .total-section { text-align: right; margin-top: 20px; }
    .total-row { display: flex; justify-content: flex-end; margin: 5px 0; }
    .total-label { margin-right: 20px; min-width: 100px; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BrandBanda</h1>
      <h2>Invoice #${data.invoiceNumber}</h2>
    </div>
    
    <div class="invoice-details">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <h3>Bill To:</h3>
          <p>
            ${data.customerName}<br>
            ${data.customerEmail}<br>
            ${data.customerAddress || ''}
          </p>
        </div>
        <div>
          <h3>Invoice Details:</h3>
          <p>
            Invoice Date: ${data.invoiceDate}<br>
            Due Date: ${data.dueDate}<br>
            Status: ${data.status}
          </p>
        </div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${data.currency} ${item.unitPrice}</td>
            <td>${data.currency} ${item.amount}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total-section">
      <div class="total-row">
        <span class="total-label">Subtotal:</span>
        <span>${data.currency} ${data.subtotal}</span>
      </div>
      <div class="total-row">
        <span class="total-label">VAT (${data.taxRate}%):</span>
        <span>${data.currency} ${data.tax}</span>
      </div>
      <div class="total-row" style="font-weight: bold; font-size: 18px;">
        <span class="total-label">Total:</span>
        <span>${data.currency} ${data.total}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>BrandBanda - Professional Branding Solutions</p>
      <p>Questions? Contact us at support@brandbanda.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateInvoiceText(data) {
  return `
INVOICE #${data.invoiceNumber}

BrandBanda
Invoice Date: ${data.invoiceDate}
Due Date: ${data.dueDate}

BILL TO:
${data.customerName}
${data.customerEmail}
${data.customerAddress || ''}

ITEMS:
${data.items.map(item => 
  `${item.description} - Qty: ${item.quantity} x ${data.currency} ${item.unitPrice} = ${data.currency} ${item.amount}`
).join('\n')}

Subtotal: ${data.currency} ${data.subtotal}
VAT (${data.taxRate}%): ${data.currency} ${data.tax}
TOTAL: ${data.currency} ${data.total}

Thank you for your business!
BrandBanda - Professional Branding Solutions
Questions? Contact us at support@brandbanda.com
  `;
}

// Run the debug tool
debugInvoiceEmail().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});