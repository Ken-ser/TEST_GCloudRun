import type { FastifyPluginAsync } from 'fastify';

import login from './login.js';

const userPlugin: FastifyPluginAsync = async (fastify, _options) => {
  await fastify.register(
    async (fastify) => {
      fastify.post('/login', login);
    },
    { prefix: '/user' },
  );
};

export default userPlugin;
