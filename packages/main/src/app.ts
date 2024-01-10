import autoLoad from '@efebia/fastify-auto-import';
import { fastifyCors } from '@fastify/cors';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastify, type FastifyPluginAsync } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';
import { createDefaultAjv } from './libs/fastify/ajv.js';
import { responses } from './libs/fastify/responses.js';
import { middlewareError } from './libs/middlewares/error.js';
import fastifyMultipart from '@fastify/multipart';

export const createApplication = async () => {
  const app = fastify();

  createDefaultAjv();

  await app.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
  });

  await app.register(fastifyMultipart, { attachFieldsToBody: 'keyValues' })

  await app.register(fastifyPlugin(responses));

  await app.register(fastifySwagger, {
    openapi: {
      info: { title: 'GCloudRunTEST APIs', version: '1.0.0' },
      tags: [],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  app.addHook('onResponse', (request, _reply, done) => {
    const { method, url } = request;
    if (url === '/v1') return;
    if (['OPTIONS', 'HEAD'].includes(method)) return;
    if (url.includes('docs')) return;

    if (request.body && typeof request.body === 'object' && 'password' in request.body) {
      delete request.body?.password;
    }

    done();
  });

  const v1: FastifyPluginAsync = async (fastify, _options) => {
    await fastify.register(middlewareError);

    await fastify.register(autoLoad, {
      startingDirectory: import.meta.url,
      directory: 'v1/plugins',
      routeFile: 'routes',
    });
  };

  app.get('/healthcheck', {
    schema: { description: 'Health check endpoint of the API server' },
    handler: () => ({ message: 'ok' }),
  });

  await app.register(v1, { prefix: '/v1' });

  return app;
};
