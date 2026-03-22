import { Injectable } from '@nestjs/common';
import * as config from './config.json';
import * as firebase from 'firebase-admin';


@Injectable()
export class FirebaseService {
  firebaseConfig;
  constructor() {
    const firebaseConfig: any = config;
    firebase.initializeApp({
      credential: firebase.credential.cert(firebaseConfig),
    });
  }
  app() {
    return firebase;
  }
}
