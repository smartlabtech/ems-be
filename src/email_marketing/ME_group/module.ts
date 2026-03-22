import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ME_group, MEGroupSchema } from './schema';
import { ME_tag, METagSchema } from '../ME_tag/schema';
import { MEGroupController } from './controller';
import { MEGroupService } from './service';
import { PassportModule } from '@nestjs/passport';
import { RoleModule } from '../../modules/roles.module';
import { UserModule } from '../../modules/users.module';
import { ActionLogModule } from '../../modules/actionLog.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => ActionLogModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: ME_group.name, schema: MEGroupSchema },
      { name: ME_tag.name, schema: METagSchema }
    ]),
  ],
  controllers: [MEGroupController],
  providers: [MEGroupService],
  exports: [MEGroupService],
})
export class MEGroupModule {} 