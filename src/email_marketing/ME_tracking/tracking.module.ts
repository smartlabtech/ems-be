import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { ME_message, MEMessageSchema } from '../ME_message/schema';
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
      { name: ME_message.name, schema: MEMessageSchema },
    ]),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}