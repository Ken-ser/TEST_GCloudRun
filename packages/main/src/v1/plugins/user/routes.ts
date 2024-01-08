import type { FastifyPluginAsync } from 'fastify';
import application from './application.js';

const applicationPlugin: FastifyPluginAsync = async (fastify, _options) => {
  await fastify.register(
    async (fastify) => {
      fastify.post('', application);
    },
    { prefix: '/application' },
  );
};

export default applicationPlugin;
