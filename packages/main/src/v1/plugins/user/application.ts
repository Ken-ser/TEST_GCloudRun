import { applicationArgs, applicationResponse } from '../../schemas/application.js';
import { route } from '../../../libs/fastify/route.js';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { HTTP } from '../../../libs/fastify/responses.js';
import { getEnv } from '../../../libs/env.js';
import { randomUUID } from 'node:crypto';

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
      const storage = getStorage(globalThis.fireBaseApp);
      const id = randomUUID();
      const storageRef = ref(storage, `cvs/${id}`);
      // Push file into storage
      const fileUploaded = await uploadBytes(storageRef, cv, {
        contentType: 'application/pdf',
      });
      const fileUrl = await getDownloadURL(fileUploaded.ref);

      const db = getFirestore(globalThis.fireBaseApp);
      // Push data into Firestore
      const applicationRef = doc(db, 'applications', `${name} ${surname}`);
      await setDoc(applicationRef, { cv: id, name, surname, email, position, motivation }, { merge: true });

      await fetch(getEnv('slackwebhook'), {
        method: 'POST',
        body: JSON.stringify({
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'New application :inbox_tray:',
                emoji: true
              }
            },
            {
              type: 'divider'
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Name:*\n${name}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Surname:*\n${surname}`
                }
              ]
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Position:*\n${position}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Email:*\n${email}`
                }
              ]
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Motivation:*\n${motivation}`
              }
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Download C.V. ⬇️',
                    emoji: true
                  },
                  url: fileUrl,
                  value: 'Download C.V. :arrow_down:',
                  // eslint-disable-next-line camelcase
                  action_id: 'actionId-0'
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