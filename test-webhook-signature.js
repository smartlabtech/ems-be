const crypto = require('crypto');

// Test webhook signature generation
const secret = '98ba5ba7673175afc8bcc115a3670d9694670c4b587ab5e5b84771e7a947f7c9';

const payload = {
  "id": "evt_1234567890",
  "type": "payment_intent.status.updated",
  "created": 1234567890000,
  "data": {
    "object": {
      "id": "test-payment-intent-1234567890",
      "account_id": "test-account",
      "amount": 100,
      "tip_amount": 0,
      "currency_code": "USD",
      "status": "completed",
      "payment_method_details": {
        "type": "card",
        "card": {
          "last4": "4242",
          "brand": "visa"
        }
      },
      "metadata": {
        "orderId": "68d2b9db932ae3aed59e59ef",
        "orderType": "subscription",
        "userId": "68701ad3bf3135725495e1a6"
      }
    }
  }
};

// Method 1: JSON.stringify directly
const payloadString = JSON.stringify(payload);
const signature1 = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

console.log('Payload string length:', payloadString.length);
console.log('First 100 chars of payload:', payloadString.substring(0, 100));
console.log('Signature (Method 1):', signature1);

// Method 2: Pretty JSON (Ziina might use this)
const payloadPretty = JSON.stringify(payload, null, 2);
const signature2 = crypto.createHmac('sha256', secret).update(payloadPretty).digest('hex');
console.log('\nSignature (Pretty JSON):', signature2);

// Method 3: Compact JSON with sorted keys
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);

  return Object.keys(obj).sort().reduce((sorted, key) => {
    sorted[key] = sortObjectKeys(obj[key]);
    return sorted;
  }, {});
}

const sortedPayload = sortObjectKeys(payload);
const payloadSorted = JSON.stringify(sortedPayload);
const signature3 = crypto.createHmac('sha256', secret).update(payloadSorted).digest('hex');
console.log('Signature (Sorted keys):', signature3);

console.log('\n--- Test with curl ---');
console.log(`curl -X POST http://localhost:3041/api/webhooks/ziina \\
  -H "Content-Type: application/json" \\
  -H "ziina-signature: ${signature1}" \\
  -d '${payloadString}'`);