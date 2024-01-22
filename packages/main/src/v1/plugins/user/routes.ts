import type { FastifyPluginAsync } from 'fastify';
import application from './application.js';
import contact from './contact.js';

const plugin: FastifyPluginAsync = async (fastify, _options) => {
  await fastify.register(
    // eslint-disable-next-line require-await
    async (fastify) => {
      fastify.post('/application', application);
      fastify.post('/contact', contact);
    }
  );
};

export default plugin;
