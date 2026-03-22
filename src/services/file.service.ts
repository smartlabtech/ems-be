import { BadRequestException, Injectable, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { FirebaseService } from '../firebase';

import * as fileType from 'file-type';
import { generateBussinessError } from '../handlers/error-creator';
import { BusinessException } from 'src/exceptions/business.exception';
import { ErrorCodes } from 'src/constants/error-codes';


@Injectable()
export class FileService {
  constructor(private firebaseService: FirebaseService) {
  }


  async uploadBinary(file: any, lang, type, userId): Promise<any> {
    return this.uploadFirebase(file.buffer, { name: file.originalname }, lang, type, userId);
  }

  async uploadFirebase(file: any, mimeInfo, lang, type, userId)
    : Promise<any> {

    await this.deleteUserFiles(userId)

    try {
      const d = new Date();
      // const fileName = mimeInfo.name ? mimeInfo.name : mimeInfo.ext

      // we add this randon number to prevent cashing on google storage
      const randomNo = Math.floor(10000 + Math.random() * 90000); // Generates a number from 10000 to 99999

      let path;
      if (type === 'profile') {
        path = `${userId}_${randomNo}.JPEG`;
      }


      const storage = await this.firebaseService.app().storage()
      const bucket = storage.bucket('user-profile');
      const firebasefile = bucket.file(path);
      const contents = file;


      await firebasefile.save(contents, { public: true })
      const url = await firebasefile.publicUrl()

      return path;
    } catch (err) {
      console.log(err)
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteUserFiles(userId: string): Promise<void> {
    try {
      const storage = await this.firebaseService.app().storage();
      const bucket = storage.bucket('user-profile');

      const [files] = await bucket.getFiles({ prefix: `` });

      // Filter files that contain userId in the path
      const userFiles = files.filter(file => file.name.includes(userId));

      // Delete each file
      const deletePromises = userFiles.map(file => file.delete());
      await Promise.all(deletePromises);

      console.log(`All files for user ${userId} have been deleted.`);
    } catch (err) {
      console.error("Error deleting user files:", err);
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
