import { route } from '../../../libs/fastify/route.js';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { getEnv } from '../../../libs/env.js';
import { contactArgs, contactResponse } from '../../schemas/contact.js';
import { randomUUID } from 'crypto';

export default route(
  {
    Tags: ['contact'],
    Body: contactArgs,
    Reply: z.object({
      200: contactResponse
    }),
  },
  async (req, reply) => {
    const { name, email, message } = req.body;

    const db = getFirestore(globalThis.fireBaseApp);
    const id = randomUUID();
    // Push data into Firestore
    const contactRef = doc(db, 'messages', `${name}_${id}`);
    await setDoc(contactRef, { name, email, message }, { merge: true });
    
    await fetch(getEnv('slackwebhook'), {
      method: 'POST',
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'New contact message :incoming_envelope:',
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
                text: `*Email:*\n${email}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${message}`
            }
          }
        ]
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return reply.ok({ message: 'Message Sent' });
  }
);