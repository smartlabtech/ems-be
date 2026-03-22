import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ME_template, METemplateSchema } from './schema';
import { METemplateService } from './service';
import { METemplateController } from './controller';
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
      { name: ME_template.name, schema: METemplateSchema },
    ]),
  ],
  controllers: [METemplateController],
  providers: [METemplateService],
  exports: [METemplateService],
})
export class METemplateModule {} 