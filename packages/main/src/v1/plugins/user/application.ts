import { applicationArgs, applicationResponse } from '../../schemas/application.js';
import { route } from '../../../libs/fastify/route.js';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { HTTP } from '../../../libs/fastify/responses.js';
import { getEnv } from '../../../libs/env.js';

const app = initializeApp({
  apiKey: getEnv('apiKey'),
  authDomain: getEnv('authDomain'),
  projectId: getEnv('projectId'),
  storageBucket: getEnv('storageBucket'),
  messagingSenderId: getEnv('messagingSenderId'),
  appId: getEnv('appId'),
  measurementId: getEnv('measurementId')
});

export default route(
  {
    Tags: ['application'],
    Body: applicationArgs,
    Reply: z.object({
      200: applicationResponse,
      400: applicationResponse,
      500: applicationResponse
    }),
  },
  async (req, reply) => {
    const { cv, name, surname, email, position, motivation } = req.body;

    if (!cv) {
      return HTTP.badRequest({ message: 'Invalid CV!' });
    }

    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `cvs/${name} ${surname}`);
      // Push file into storage
      await uploadBytes(storageRef, cv, {
        contentType: 'application/pdf',
      });

      console.log('Filename Input Value:', req.body);

      const db = getFirestore(app);
      // Push data into Firestore
      const applicationRef = doc(db, 'applications', `${name} ${surname}`);
      await setDoc(applicationRef, { name, surname, email, position, motivation }, { merge: true })

      return reply.ok({ message: 'File uploaded successfully' });
    } catch (error) {
      console.error(error);
      return HTTP.internalServerError({ message: 'Internal Server Error' });
    }
  }
);