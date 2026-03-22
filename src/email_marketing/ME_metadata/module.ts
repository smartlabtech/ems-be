import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ME_metadata, MEMetadataSchema } from './schema';
import { MEMetadataService } from './service';
import { MEMetadataController } from './controller';
import { RoleModule, UserModule } from 'src/modules';
import { ActionLogModule } from 'src/modules/actionLog.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => ActionLogModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: ME_metadata.name, schema: MEMetadataSchema }
    ]),
  ],
  controllers: [MEMetadataController],
  providers: [MEMetadataService],
  exports: [MEMetadataService],
})
export class MEMetadataModule {}