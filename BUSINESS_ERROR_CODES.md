# Business Error Codes Documentation

## Overview

The API now returns structured business errors with specific error codes that the frontend can use to take appropriate actions. Instead of generic 400 errors, you'll receive detailed error information with actionable codes.

## Response Format

When a business error occurs, the response will follow this structure:

```json
{
  "statusCode": 400,
  "errorCode": 1001,
  "message": "Insufficient credits. Required: 3, Available: 0",
  "details": {
    "required": 3,
    "available": 0,
    "action": "recharge_credits"
  },
  "timestamp": "2024-01-20T10:30:00.000Z",
  "path": "/api/en/project-product"
}
```

## Error Codes and Actions

### Credit Related Errors (1000-1099)

| Code | Name | Action | Description |
|------|------|--------|-------------|
| 1001 | INSUFFICIENT_CREDITS | `recharge_credits` | User doesn't have enough credits. Show recharge dialog. |
| 1002 | CREDITS_EXPIRED | `recharge_credits` | User's credits have expired. |
| 1003 | INVALID_CREDIT_AMOUNT | `check_input` | Invalid credit amount provided. |

### Subscription Related Errors (1100-1199)

| Code | Name | Action | Description |
|------|------|--------|-------------|
| 1101 | NO_ACTIVE_SUBSCRIPTION | `subscribe_plan` | User needs to subscribe to a plan. |
| 1102 | SUBSCRIPTION_EXPIRED | `renew_subscription` | User's subscription has expired. |
| 1103 | SUBSCRIPTION_SUSPENDED | `resolve_payment` | Subscription suspended due to payment issues. |
| 1104 | SUBSCRIPTION_LIMIT_REACHED | `upgrade_plan` | User has reached their plan's limit. |
| 1105 | PLAN_NOT_AVAILABLE | `choose_different_plan` | Selected plan is not available. |

### Payment Related Errors (1200-1299)

| Code | Name | Action | Description |
|------|------|--------|-------------|
| 1201 | PAYMENT_FAILED | `retry_payment` | Payment processing failed. |
| 1202 | PAYMENT_METHOD_REQUIRED | `add_payment_method` | No payment method on file. |
| 1203 | INVALID_PAYMENT_METHOD | `update_payment_method` | Payment method is invalid or expired. |
| 1204 | REFUND_FAILED | `contact_support` | Refund processing failed. |

### Resource Limit Errors (1300-1399)

| Code | Name | Action | Description |
|------|------|--------|-------------|
| 1301 | PROJECT_LIMIT_REACHED | `upgrade_plan` | Maximum projects limit reached. |
| 1302 | BRAND_MESSAGE_LIMIT_REACHED | `upgrade_plan` | Maximum brand messages limit reached. |
| 1303 | PRODUCT_VERSION_LIMIT_REACHED | `upgrade_plan` | Maximum product versions limit reached. |
| 1304 | TEAM_MEMBER_LIMIT_REACHED | `upgrade_plan` | Maximum team members limit reached. |

## Frontend Implementation Example

```typescript
// API response handler
async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json();
    
    // Check if it's a business error with an error code
    if (error.errorCode) {
      switch (error.errorCode) {
        case 1001: // INSUFFICIENT_CREDITS
          showRechargeDialog({
            required: error.details.required,
            available: error.details.available
          });
          break;
          
        case 1101: // NO_ACTIVE_SUBSCRIPTION
          redirectToSubscriptionPage();
          break;
          
        case 1104: // SUBSCRIPTION_LIMIT_REACHED
          showUpgradePlanDialog({
            limitType: error.details.limitType,
            current: error.details.current,
            limit: error.details.limit
          });
          break;
          
        case 1202: // PAYMENT_METHOD_REQUIRED
          showAddPaymentMethodDialog();
          break;
          
        default:
          showGenericErrorMessage(error.message);
      }
    } else {
      // Handle non-business errors
      showGenericErrorMessage('An error occurred');
    }
  }
}
```

## Action Types

The `details.action` field suggests what action the frontend should take:

- `recharge_credits`: Open credit recharge/purchase dialog
- `subscribe_plan`: Redirect to subscription plans page
- `upgrade_plan`: Show plan upgrade options
- `add_payment_method`: Show payment method addition form
- `update_payment_method`: Show payment method update form
- `resolve_payment`: Show payment issue resolution steps
- `retry_payment`: Allow user to retry the payment
- `contact_support`: Show contact support information

## Best Practices

1. **Always check for `errorCode`** before handling as a business error
2. **Use the `details` object** for additional context in your UI
3. **Implement fallback handling** for unknown error codes
4. **Log unhandled error codes** for monitoring and future implementation
5. **Use the suggested `action`** to guide user experience

## Example: Handling Insufficient Credits

When a user tries to create a project product without sufficient credits:

```javascript
try {
  const response = await fetch('/api/en/project-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (error.errorCode === 1001) {
      // Show recharge dialog with credit information
      openRechargeModal({
        message: `You need ${error.details.required} credits but only have ${error.details.available}`,
        requiredCredits: error.details.required - error.details.available
      });
      return;
    }
    
    throw new Error(error.message);
  }
  
  // Handle success
  const result = await response.json();
  showSuccessMessage('Product created successfully!');
  
} catch (error) {
  showErrorMessage(error.message);
}
```

This approach provides a much better user experience by:
- Giving specific, actionable error information
- Allowing the frontend to handle different scenarios appropriately
- Reducing user frustration with clear next steps
- Enabling analytics on specific error types