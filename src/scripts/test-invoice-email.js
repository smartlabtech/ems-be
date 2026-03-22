const axios = require('axios');
require('dotenv').config();

async function testInvoiceEmail(invoiceId, userEmail) {
  console.log('🧪 Testing Invoice Email Sending\n');
  console.log('='.repeat(50));
  
  if (!invoiceId || !userEmail) {
    console.error('❌ Usage: node test-invoice-email.js <invoice-id> <user-email>');
    console.log('Example: node test-invoice-email.js 507f1f77bcf86cd799439011 user@example.com');
    return;
  }

  console.log('📋 Test Configuration:');
  console.log(`   Invoice ID: ${invoiceId}`);
  console.log(`   User Email: ${userEmail}`);
  console.log(`   API URL: ${process.env.MAILRELAY_API_URL || '❌ NOT SET'}`);
  console.log(`   From Email: ${process.env.EMAIL_FROM || '❌ NOT SET'}`);
  console.log('');

  // Prepare test invoice data
  const testInvoiceData = {
    invoiceNumber: 'TEST-INV-001',
    invoiceDate: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    customerName: 'Test Customer',
    customerEmail: userEmail,
    customerAddress: '123 Test Street, Test City',
    items: [
      {
        description: 'Premium Subscription',
        quantity: 1,
        unitPrice: 99.99,
        amount: 99.99,
        currency: 'USD'
      },
      {
        description: 'Setup Fee',
        quantity: 1,
        unitPrice: 25.00,
        amount: 25.00,
        currency: 'USD'
      }
    ],
    currency: 'USD',
    subtotal: 124.99,
    tax: 6.25,
    taxRate: 5,
    total: 131.24,
    status: 'pending',
    notes: 'This is a test invoice for debugging purposes',
    paymentUrl: 'https://payment.example.com/test-invoice'
  };

  console.log('📧 Testing Direct Mailrelay API Call...');
  console.log('-'.repeat(30));

  try {
    // Test with invoice HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .invoice-header { background: #2c3e50; color: white; padding: 20px; }
    .invoice-body { padding: 20px; background: #f9f9f9; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #34495e; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .total { font-weight: bold; font-size: 1.2em; background: #ecf0f1; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>Invoice #${testInvoiceData.invoiceNumber}</h1>
    <p>Date: ${testInvoiceData.invoiceDate}</p>
  </div>
  <div class="invoice-body">
    <h3>Bill To: ${testInvoiceData.customerName}</h3>
    <p>${testInvoiceData.customerEmail}</p>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${testInvoiceData.items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${item.currency} ${item.unitPrice}</td>
            <td>${item.currency} ${item.amount}</td>
          </tr>
        `).join('')}
        <tr class="total">
          <td colspan="3">Subtotal</td>
          <td>${testInvoiceData.currency} ${testInvoiceData.subtotal}</td>
        </tr>
        <tr>
          <td colspan="3">Tax (${testInvoiceData.taxRate}%)</td>
          <td>${testInvoiceData.currency} ${testInvoiceData.tax}</td>
        </tr>
        <tr class="total">
          <td colspan="3">Total</td>
          <td>${testInvoiceData.currency} ${testInvoiceData.total}</td>
        </tr>
      </tbody>
    </table>
    
    ${testInvoiceData.paymentUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${testInvoiceData.paymentUrl}" style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Pay Invoice</a>
      </div>
    ` : ''}
    
    ${testInvoiceData.notes ? `
      <div style="margin-top: 30px;">
        <h3>Notes:</h3>
        <p>${testInvoiceData.notes}</p>
      </div>
    ` : ''}
  </div>
</body>
</html>`;

    // Create a sample PDF attachment (base64 encoded minimal PDF)
    const minimalPDF = `JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+PgovPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVApxCjcwIDUwIFRECi9GMSAxMiBUZgooVGVzdCBJbnZvaWNlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMzAgMDAwMDAgbiAKMDAwMDAwMDI0MCAwMDAwMCBuIAowMDAwMDAwMzE3IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDA5CiUlRU9G`;

    const payload = {
      from: {
        email: process.env.EMAIL_FROM || 'noreply@2zpoint.com',
        name: process.env.EMAIL_FROM_NAME || 'BrandBanda'
      },
      to: [{
        email: userEmail,
        name: testInvoiceData.customerName
      }],
      subject: `Invoice #${testInvoiceData.invoiceNumber} - BrandBanda`,
      html_part: htmlContent,
      text_part: `Invoice #${testInvoiceData.invoiceNumber}\n\nAmount Due: ${testInvoiceData.currency} ${testInvoiceData.total}\nDue Date: ${testInvoiceData.dueDate}\n\nPlease pay your invoice online at: ${testInvoiceData.paymentUrl}`,
      smtp_tags: ['invoice', 'test', 'debug'],
      attachments: [{
        content: minimalPDF,
        file_name: `invoice-${testInvoiceData.invoiceNumber}.pdf`,
        content_type: 'application/pdf',
        content_id: ''
      }]
    };

    console.log('📤 Sending invoice email to Mailrelay...');
    console.log(`   To: ${userEmail}`);
    console.log(`   Subject: ${payload.subject}`);
    console.log(`   Attachments: 1 PDF (test)`);
    console.log(`   Payload size: ${(JSON.stringify(payload).length / 1024).toFixed(2)} KB`);
    
    const response = await axios.post(
      process.env.MAILRELAY_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': process.env.MAILRELAY_AUTH_TOKEN
        },
        timeout: 30000,
        validateStatus: () => true
      }
    );

    console.log(`\n📨 Response Status: ${response.status}`);
    console.log(`📝 Response Data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 || response.status === 201) {
      console.log('\n✅ Invoice email sent successfully!');
      console.log(`✉️ Check inbox at: ${userEmail}`);
    } else if (response.status === 422) {
      console.error('\n❌ Validation error from Mailrelay');
      if (response.data.errors) {
        Object.keys(response.data.errors).forEach(field => {
          console.error(`   ${field}: ${response.data.errors[field].join(', ')}`);
        });
      }
    } else {
      console.error('\n❌ Failed to send invoice email');
    }
  } catch (error) {
    console.error('\n❌ Error sending invoice email:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
}

// Main
(async () => {
  console.clear();
  console.log('🚀 Invoice Email Debug Test');
  console.log('='.repeat(50));
  
  const invoiceId = process.argv[2];
  const userEmail = process.argv[3];
  
  await testInvoiceEmail(invoiceId, userEmail);
  
  console.log('\n✨ Test complete!\n');
})();