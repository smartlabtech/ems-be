import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ME_tag, METagSchema } from './schema';
import { ME_group, MEGroupSchema } from '../ME_group/schema';
import { METagController } from './controller';
import { METagService } from './service';
import { PassportModule } from '@nestjs/passport';
import { RoleModule } from '../../modules/roles.module';
import { UserModule } from '../../modules/users.module';
import { ActionLogModule } from '../../modules/actionLog.module';
import { ME_taggedBy, METaggedBySchema } from '../ME_taggedBy/schema';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => ActionLogModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: ME_tag.name, schema: METagSchema },
      { name: ME_taggedBy.name, schema: METaggedBySchema },
      { name: ME_group.name, schema: MEGroupSchema },
    ]),
  ],
  controllers: [METagController],
  providers: [METagService],
  exports: [METagService],
})
export class METagModule {} 