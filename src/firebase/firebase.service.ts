import { Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';


@Injectable()
export class FirebaseService {
  firebaseConfig;
  constructor() {
    firebase.initializeApp({
      credential: firebase.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  app() {
    return firebase;
  }
}
