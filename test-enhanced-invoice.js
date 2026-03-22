const axios = require('axios');
require('dotenv').config();

async function testEnhancedInvoice() {
  console.log('🎨 Testing Enhanced Invoice Template & PDF Generation\n');
  console.log('='.repeat(60));
  
  // Test configuration
  const testEmail = process.argv[2] || 'test@example.com';
  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`🔗 Mailrelay API: ${process.env.MAILRELAY_API_URL}`);
  console.log('');

  // Create comprehensive test invoice data
  const testInvoiceData = {
    invoiceNumber: 'INV-2024-001',
    invoiceDate: 'January 15, 2024',
    dueDate: 'January 30, 2024',
    customerName: 'John Smith',
    customerEmail: testEmail,
    customerAddress: '123 Business Avenue',
    billingDetails: {
      companyName: 'Tech Solutions Inc.',
      firstName: 'John',
      lastName: 'Smith',
      email: testEmail,
      phone: '+971 50 123 4567',
      address: '123 Business Avenue',
      city: 'Dubai',
      state: 'Dubai',
      country: 'United Arab Emirates',
      postalCode: '12345',
      taxId: 'TRN100234567890'
    },
    items: [
      {
        description: 'BrandBanda Premium Subscription - Monthly Plan',
        quantity: 1,
        unitPrice: '299.99',
        amount: '299.99',
        currency: 'USD'
      },
      {
        description: 'Logo Design Service - Professional Package',
        quantity: 2,
        unitPrice: '500.00',
        amount: '1000.00',
        currency: 'USD'
      },
      {
        description: 'Brand Consultation - 2 Hour Session',
        quantity: 1,
        unitPrice: '450.00',
        amount: '450.00',
        currency: 'USD'
      },
      {
        description: 'Social Media Templates - Complete Set',
        quantity: 1,
        unitPrice: '199.99',
        amount: '199.99',
        currency: 'USD'
      }
    ],
    currency: 'USD',
    subtotal: '1949.98',
    taxRate: '5',
    tax: '97.50',
    discount: '50.00',
    discountDescription: 'Early Payment Discount',
    total: '1997.48',
    amountPaid: '0.00',
    amountDue: '1997.48',
    status: 'sent',
    notes: 'Payment is due within 15 days. A late fee of 2% per month will be applied to overdue invoices.',
    termsAndConditions: 'All services are subject to our standard terms and conditions available at brandbanda.com/terms',
    paymentUrl: 'https://payment.brandbanda.com/invoice/INV-2024-001',
    orderId: '507f1f77bcf86cd799439011',
    subscriptionId: '507f1f77bcf86cd799439012'
  };

  console.log('📋 Invoice Summary:');
  console.log(`   Items: ${testInvoiceData.items.length}`);
  console.log(`   Subtotal: ${testInvoiceData.currency} ${testInvoiceData.subtotal}`);
  console.log(`   Tax: ${testInvoiceData.currency} ${testInvoiceData.tax}`);
  console.log(`   Discount: ${testInvoiceData.currency} ${testInvoiceData.discount}`);
  console.log(`   Total: ${testInvoiceData.currency} ${testInvoiceData.total}`);
  console.log('');

  // Read the template file
  const fs = require('fs');
  const path = require('path');
  const handlebars = require('handlebars');

  try {
    console.log('📄 Reading and compiling invoice template...');
    const templatePath = path.join(__dirname, 'src/templates/emails/invoice.hbs');
    
    if (!fs.existsSync(templatePath)) {
      console.error(`❌ Template not found at: ${templatePath}`);
      return;
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    
    // Add appName to context
    const context = {
      ...testInvoiceData,
      appName: 'BrandBanda'
    };
    
    const htmlContent = template(context);
    console.log(`✅ Template compiled successfully (${(htmlContent.length / 1024).toFixed(2)} KB)`);
    
    // Save HTML preview
    const previewPath = path.join(__dirname, 'invoice-preview.html');
    fs.writeFileSync(previewPath, htmlContent);
    console.log(`💾 HTML preview saved to: ${previewPath}`);
    console.log('');

    // Create a sample PDF for testing
    console.log('📎 Creating test PDF attachment...');
    const PDFDocument = require('pdfkit');
    const pdfPath = path.join(__dirname, 'test-invoice.pdf');
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const pdfStream = fs.createWriteStream(pdfPath);
    doc.pipe(pdfStream);
    
    // Generate a more complete PDF
    doc.fontSize(24).text('BrandBanda', 50, 50);
    doc.fontSize(16).text(`Invoice #${testInvoiceData.invoiceNumber}`, 50, 90);
    doc.fontSize(12).text(`Date: ${testInvoiceData.invoiceDate}`, 50, 120);
    doc.text(`Due Date: ${testInvoiceData.dueDate}`, 50, 140);
    
    // Add customer details
    doc.fontSize(14).text('Bill To:', 50, 180);
    doc.fontSize(11);
    doc.text(testInvoiceData.billingDetails.companyName, 50, 200);
    doc.text(`${testInvoiceData.billingDetails.firstName} ${testInvoiceData.billingDetails.lastName}`, 50, 215);
    doc.text(testInvoiceData.billingDetails.email, 50, 230);
    doc.text(testInvoiceData.billingDetails.phone, 50, 245);
    doc.text(testInvoiceData.billingDetails.address, 50, 260);
    doc.text(`${testInvoiceData.billingDetails.city}, ${testInvoiceData.billingDetails.postalCode}`, 50, 275);
    doc.text(testInvoiceData.billingDetails.country, 50, 290);
    
    // Add items
    let y = 330;
    doc.fontSize(12).text('Items:', 50, y);
    y += 20;
    
    testInvoiceData.items.forEach(item => {
      doc.fontSize(10);
      doc.text(item.description, 50, y);
      doc.text(`Qty: ${item.quantity}`, 350, y);
      doc.text(`${item.currency} ${item.amount}`, 450, y);
      y += 20;
    });
    
    // Add totals
    y += 20;
    doc.fontSize(11);
    doc.text(`Subtotal: ${testInvoiceData.currency} ${testInvoiceData.subtotal}`, 350, y);
    y += 20;
    doc.text(`Tax (${testInvoiceData.taxRate}%): ${testInvoiceData.currency} ${testInvoiceData.tax}`, 350, y);
    y += 20;
    doc.text(`Discount: -${testInvoiceData.currency} ${testInvoiceData.discount}`, 350, y);
    y += 25;
    doc.fontSize(14).text(`Total: ${testInvoiceData.currency} ${testInvoiceData.total}`, 350, y);
    
    // Add footer
    doc.fontSize(9).text('Thank you for your business!', 50, 700, { width: 500, align: 'center' });
    
    doc.end();
    
    await new Promise(resolve => pdfStream.on('finish', resolve));
    
    const pdfStats = fs.statSync(pdfPath);
    console.log(`✅ PDF created: ${pdfPath} (${(pdfStats.size / 1024).toFixed(2)} KB)`);
    
    // Read PDF as base64
    const pdfContent = fs.readFileSync(pdfPath).toString('base64');
    console.log(`📊 Base64 PDF size: ${(pdfContent.length / 1024).toFixed(2)} KB`);
    console.log('');

    // Send test email
    console.log('📤 Sending test invoice email via Mailrelay...');
    
    const payload = {
      from: {
        email: process.env.EMAIL_FROM || 'no-reply@brandbanda.com',
        name: 'BrandBanda'
      },
      to: [{
        email: testEmail,
        name: testInvoiceData.customerName
      }],
      subject: `Invoice #${testInvoiceData.invoiceNumber} - BrandBanda`,
      html_part: htmlContent,
      text_part: `Invoice #${testInvoiceData.invoiceNumber}
      
Amount Due: ${testInvoiceData.currency} ${testInvoiceData.total}
Due Date: ${testInvoiceData.dueDate}

Please pay your invoice online at: ${testInvoiceData.paymentUrl}

Thank you for your business!`,
      smtp_tags: ['invoice', 'test'],
      attachments: [{
        content: pdfContent,
        file_name: `invoice-${testInvoiceData.invoiceNumber}.pdf`,
        content_type: 'application/pdf',
        content_id: ''
      }]
    };
    
    console.log(`   To: ${testEmail}`);
    console.log(`   Subject: ${payload.subject}`);
    console.log(`   Total payload size: ${(JSON.stringify(payload).length / 1024).toFixed(2)} KB`);
    
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
    
    console.log('');
    console.log(`📨 Response Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 || response.status === 201) {
      console.log('');
      console.log('✅ SUCCESS! Invoice email sent successfully!');
      console.log(`✉️ Check inbox at: ${testEmail}`);
      console.log(`🎨 HTML preview available at: ${previewPath}`);
      console.log(`📄 PDF sample available at: ${pdfPath}`);
    } else {
      console.error('');
      console.error('❌ Failed to send invoice email');
      if (response.data.errors) {
        Object.keys(response.data.errors).forEach(field => {
          console.error(`   ${field}: ${response.data.errors[field].join(', ')}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
}

// Run the test
(async () => {
  console.clear();
  console.log('🚀 Enhanced Invoice Template & PDF Test');
  console.log('='.repeat(60));
  
  if (process.argv[2]) {
    await testEnhancedInvoice();
  } else {
    console.log('Usage: node test-enhanced-invoice.js <email>');
    console.log('Example: node test-enhanced-invoice.js user@example.com');
  }
  
  console.log('\n✨ Test complete!\n');
})();