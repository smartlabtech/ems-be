// File: src/email_marketing/email_service_provider/module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { EmailServiceProvider, EmailServiceProviderSchema } from './schema';
import { ME_email, MEEmailSchema } from '../ME_email/schema';
import { MEMessageModule } from '../ME_message/module';
import { EmailServiceProviderController } from './controller';
import { EmailServiceProviderService } from './service';
import { RoleModule } from '../../modules';

// Import provider services
import { EmailProviderFactory } from './providers/provider-factory.service';
import { ERPNextProviderService } from './providers/erpnext/erpnext-provider.service';
import { SendGridProviderService } from './providers/sendgrid/sendgrid-provider.service';
import { MailgunProviderService } from './providers/mailgun/mailgun-provider.service';
import { SMTPProviderService } from './providers/smtp/smtp-provider.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailServiceProvider.name, schema: EmailServiceProviderSchema },
      { name: ME_email.name, schema: MEEmailSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RoleModule,
    MEMessageModule,
  ],
  controllers: [EmailServiceProviderController],
  providers: [
    EmailServiceProviderService,
    EmailProviderFactory,
    ERPNextProviderService,
    SendGridProviderService,
    MailgunProviderService,
    SMTPProviderService,
  ],
  exports: [EmailServiceProviderService, EmailProviderFactory],
})
export class EmailServiceProviderModule {} 