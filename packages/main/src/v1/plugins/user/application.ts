import { applicationResponse } from '../../schemas/application.js';
import { route } from '../../../libs/fastify/route.js';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { z } from 'zod';

const app = initializeApp({
  apiKey: "AIzaSyDpMCGWJTtw4BrfiXAPvEpjc_1YJH9D7Sc",
  authDomain: "just-zoo-234019.firebaseapp.com",
  projectId: "just-zoo-234019",
  storageBucket: "just-zoo-234019.appspot.com",
  messagingSenderId: "77441162770",
  appId: "1:77441162770:web:fa73363ac4a50f400102cb",
  measurementId: "G-KP352CF1RT"
});

export default route(
  {
    Tags: ['application'],
    Body: z.object({
      cv: z.instanceof(Buffer),
      name: z.string(),
      surname: z.string(),
      email: z.string().email(),
      position: z.enum(['be', 'fe']),
      motivation: z.string(),
    }),
    Reply: z.object({
      200: applicationResponse,
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() })
    }),
  },
  async (req, reply) => {
    const { cv, name, surname, email, position, motivation } = req.body;
    if (!cv) {
      return reply.badRequest('Invalid CV!');
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
      return reply.internalServerError('Internal Server Error');
    }
  }
);