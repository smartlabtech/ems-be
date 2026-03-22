import { forwardRef, Module } from '@nestjs/common';
import { FileService } from '../services';
import { FileController } from '../controllers';
import { FirebaseService } from '../firebase';
import { PassportModule } from '@nestjs/passport';
import { RoleModule } from '.';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        forwardRef(() => RoleModule),
    ],
    controllers: [FileController],
    providers: [FileService, FirebaseService],
    exports: [FileService]
})
export class FileModule { }
