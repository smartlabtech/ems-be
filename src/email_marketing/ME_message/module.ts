import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ME_message, MEMessageSchema } from './schema';
import { MEMessageService } from './service';
import { MEMessageController } from './controller';
import { PassportModule } from '@nestjs/passport';
import { RoleModule } from '../../modules/roles.module';
import { UserModule } from '../../modules/users.module';
import { ActionLogModule } from '../../modules/actionLog.module';
import { ME_taggedBy, METaggedBySchema } from '../ME_taggedBy/schema';
import { ME_tag, METagSchema } from '../ME_tag/schema';
import { ME_email, MEEmailSchema } from '../ME_email/schema';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => ActionLogModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: ME_message.name, schema: MEMessageSchema },
      { name: ME_taggedBy.name, schema: METaggedBySchema },
      { name: ME_tag.name, schema: METagSchema },
      { name: ME_email.name, schema: MEEmailSchema },
    ]),
  ],
  controllers: [MEMessageController],
  providers: [MEMessageService],
  exports: [MEMessageService],
})
export class MEMessageModule {} 