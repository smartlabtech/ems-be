import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ME_taggedBy, METaggedBySchema } from './schema';
import { METaggedByController } from './controller';
import { METaggedByService } from './service';
import { PassportModule } from '@nestjs/passport';
import { RoleModule } from '../../modules/roles.module';
import { UserModule } from '../../modules/users.module';
import { ActionLogModule } from '../../modules/actionLog.module';
import { METagModule } from '../ME_tag/module';
import { ME_tag, METagSchema } from '../ME_tag/schema';
import { ME_email, MEEmailSchema } from '../ME_email/schema';
import { ME_message, MEMessageSchema } from '../ME_message/schema';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => ActionLogModule),
    forwardRef(() => METagModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: ME_taggedBy.name, schema: METaggedBySchema },
      { name: ME_tag.name, schema: METagSchema },
      { name: ME_email.name, schema: MEEmailSchema },
      { name: ME_message.name, schema: MEMessageSchema },
    ]),
  ],
  controllers: [METaggedByController],
  providers: [METaggedByService],
  exports: [METaggedByService],
})
export class METaggedByModule {} 