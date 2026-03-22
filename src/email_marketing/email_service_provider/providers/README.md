# Email Service Provider Architecture

This directory contains the refactored email service provider implementation with a clean separation of concerns for each provider.

## Architecture Overview

The email service provider system now follows a factory pattern with individual provider implementations:

```
providers/
├── base/                    # Base classes and interfaces
│   ├── base-provider.interface.ts
│   └── base-provider.service.ts
├── erpnext/                # ERPNext provider
│   └── erpnext-provider.service.ts
├── sendgrid/               # SendGrid provider
│   └── sendgrid-provider.service.ts
├── mailgun/                # Mailgun provider
│   └── mailgun-provider.service.ts
├── smtp/                   # SMTP provider
│   └── smtp-provider.service.ts
├── provider-factory.service.ts  # Factory for provider instantiation
└── index.ts                # Barrel export
```

## Adding a New Provider

To add a new email service provider:

1. **Create a new directory** for your provider:
   ```
   providers/your-provider/
   ```

2. **Create the provider service** extending `BaseEmailProviderService`:
   ```typescript
   // your-provider.service.ts
   import { Injectable } from '@nestjs/common';
   import { BaseEmailProviderService } from '../base/base-provider.service';
   
   @Injectable()
   export class YourProviderService extends BaseEmailProviderService {
     // Implement required methods
     async testConfiguration(config: IEmailProviderConfig): Promise<IEmailProviderTestResult> {
       // Your implementation
     }
     
     async sendEmail(config: IEmailProviderConfig, options: IEmailSendOptions): Promise<IEmailProviderResponse> {
       // Your implementation
     }
     
     validateConfig(config: IEmailProviderConfig): boolean {
       // Your validation logic
     }
   }
   ```

3. **Update the provider factory** in `provider-factory.service.ts`:
   - Add the provider to the constructor
   - Add a case in the `getProvider()` switch statement
   - Update `getAvailableProviders()` array

4. **Update the module** in `../module.ts`:
   - Import your provider service
   - Add it to the providers array

5. **Add the provider type** to `../enum.ts` if not already present

## Provider Interface

All providers must implement the following methods:

### `testConfiguration(config: IEmailProviderConfig): Promise<IEmailProviderTestResult>`
Tests if the provided configuration is valid and can connect to the service.

### `sendEmail(config: IEmailProviderConfig, options: IEmailSendOptions): Promise<IEmailProviderResponse>`
Sends an email using the provider's API.

### `validateConfig(config: IEmailProviderConfig): boolean`
Validates that all required configuration fields are present.

### `fetchEmailAccounts(config: IEmailProviderConfig): Promise<any[]>` (Optional)
Fetches available email accounts from the provider (currently only used by ERPNext).

## Configuration

Each provider requires different configuration fields:

### ERPNext
- `baseUrl`: The ERPNext instance URL
- `token`: API token for authentication

### SendGrid
- `apiKey`: SendGrid API key

### Mailgun
- `apiKey`: Mailgun API key
- `domain`: Mailgun domain

### SMTP
- `host`: SMTP server hostname
- `port`: SMTP server port
- `secure`: Use TLS/SSL
- `auth.user`: SMTP username
- `auth.pass`: SMTP password

## Benefits of This Architecture

1. **Separation of Concerns**: Each provider has its own isolated implementation
2. **Easy Testing**: Individual providers can be tested independently
3. **Maintainability**: Changes to one provider don't affect others
4. **Extensibility**: New providers can be added without modifying existing code
5. **Type Safety**: Strong typing through interfaces ensures consistency
6. **Reusability**: Common functionality is abstracted in the base class 