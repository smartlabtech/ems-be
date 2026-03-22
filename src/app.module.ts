import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { config } from './config.manager';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  RoleModule,
  UserModule,
} from './modules';
import { HealthController } from './controllers/health.controller';

import { ActionLogModule } from './modules/actionLog.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MEGroupModule } from './email_marketing/ME_group/module';
import { MEEmailModule } from './email_marketing/ME_email/module';
import { METagModule } from './email_marketing/ME_tag/module';
import { METaggedByModule } from './email_marketing/ME_taggedBy/module';
import { METemplateModule } from './email_marketing/ME_template/module';
import { MEMessageModule } from './email_marketing/ME_message/module';
import { MEMetadataModule } from './email_marketing/ME_metadata/module';
import { MetadataModule } from './common_metadata_module/module';
import { EmailServiceProviderModule } from './email_marketing/email_service_provider';
import { TrackingModule } from './email_marketing/ME_tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RoleModule,
    AuthModule,
    UserModule,
    ActionLogModule,
    MongooseModule.forRoot(process.env.DB_URI),
    // for monorepo static site
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MEGroupModule,
    MEEmailModule,
    METagModule,
    METaggedByModule,
    METemplateModule,
    MEMessageModule,
    MEMetadataModule,
    MetadataModule,

    EmailServiceProviderModule,
    TrackingModule,
  ],
  controllers: [HealthController],
  providers: [ValidationPipe],
})
export class AppModule { }
