import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ME_email, MEEmailSchema } from './schema';
import { MEEmailController } from './controller';
import { MEEmailService } from './service';
import { PassportModule } from '@nestjs/passport';
import { RoleModule } from '../../modules/roles.module';
import { UserModule } from '../../modules/users.module';
import { ActionLogModule } from '../../modules/actionLog.module';
import { ME_taggedBy, METaggedBySchema } from '../ME_taggedBy/schema';
import { ME_tag, METagSchema } from '../ME_tag/schema';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => ActionLogModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: ME_email.name, schema: MEEmailSchema },
      { name: ME_taggedBy.name, schema: METaggedBySchema },
      { name: ME_tag.name, schema: METagSchema },
    ]),
  ],
  controllers: [MEEmailController],
  providers: [MEEmailService],
  exports: [MEEmailService],
})
export class MEEmailModule {} 