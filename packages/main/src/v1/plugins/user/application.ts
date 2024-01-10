import { applicationArgs, applicationResponse } from '../../schemas/application.js';
import { route } from '../../../libs/fastify/route.js';
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
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
  appId: getEnv('appId')
});

export default route(
  {
    Tags: ['application'],
    Body: applicationArgs,
    Reply: z.object({
      200: applicationResponse
    }),
  },
  async (req, reply) => {
    const { cv, name, surname, email, position, motivation } = req.body;

    if (!cv) {
      throw HTTP.badRequest({ message: 'Invalid CV!' });
    }

    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `cvs/${name} ${surname}`);
      // Push file into storage
      const fileUploaded = await uploadBytes(storageRef, cv, {
        contentType: 'application/pdf',
      });

      const db = getFirestore(app);
      // Push data into Firestore
      const applicationRef = doc(db, 'applications', `${name} ${surname}`);
      await setDoc(applicationRef, { name, surname, email, position, motivation }, { merge: true })

      await fetch(getEnv('slackwebhook'), {
        method: 'POST',
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "New application :inbox_tray:",
                emoji: true
              }
            },
            {
              "type": "divider"
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Name:*\n${name}`
                },
                {
                  type: "mrkdwn",
                  text: `*Surname:*\n${surname}`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Position:*\n${position}`
                },
                {
                  type: "mrkdwn",
                  text: `*Email:*\n${email}`
                }
              ]
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Motivation:*\n${motivation}`
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Download C.V. ⬇️",
                    emoji: true
                  },
                  url: `${await getDownloadURL(fileUploaded.ref)}`,
                  value: "Download C.V. :arrow_down:",
                  action_id: "actionId-0"
                }
              ]
            }
          ]
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return reply.ok({ message: 'File uploaded successfully' });
    } catch (error) {
      console.error(error);
      throw HTTP.internalServerError({ message: 'Internal Server Error' });
    }
  }
);