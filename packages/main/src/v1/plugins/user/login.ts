import { z } from 'zod';
import { route } from '../../../libs/fastify/route.js';
import { loginArgs, loginResponse } from '../../schemas/user.js';

export default route(
  {
    Tags: ['user'],
    Body: loginArgs,
    Reply: z.object({
      200: loginResponse,
      '4xx': z.object({ message: z.string() }),
    }),
  },
  async (request, reply) => {
    const { email, password } = request.body;
    console.log(email, password);

    return reply.ok({ jwt: 'ok' });
  },
);
