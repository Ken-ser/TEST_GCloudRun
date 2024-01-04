import type { FastifyRequest } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';
import { verifyJWT } from '../fastify/auth.js';
import { HTTP } from '../fastify/responses.js';

export const middlewareError = fastifyPlugin((fastify, _opts, done) => {
  // eslint-disable-next-line require-await
  fastify.setErrorHandler(async (error, req, reply) => {
    if ([404, 401].includes(reply.statusCode)) return reply.send(error);

    delete (req.body as any)?.password;

    error.statusCode ??= reply.statusCode === 200 ? 500 : reply.statusCode;
    const payload = {
      request: {
        query: req.query,
        params: req.params,
        body: req.body,
        headers: req.headers,
        endpoint: req.url,
        method: req.method,
      },
      response: {
        payload: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
      },
      service: 'main',
    };

    //if (req.session) payload['userId'] = req.session._id;

    if (!error?.message?.startsWith('AUTH.')) {
      console.log(payload, 'REQUEST_ERROR');
    }
    if (process.env['NODE_ENV'] === 'production')
      return reply.status(error.statusCode).send({
        message: error.statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : error.message,
        statusCode: error.statusCode,
      });
    return reply.status(error.statusCode).send(error);
  });
  done();
});

const extractBearer = (str?: string) => str?.replace(/Bearer /u, '');

export const authenticationMiddleware = fastifyPlugin.default((fastify, _opts, done) => {
  // eslint-disable-next-line require-await
  fastify.addHook('preHandler', async (request, _reply) => {
    if (!request.headers.authorization)
      throw HTTP.unauthorized({
        message: 'AUTHENTICATION_ERROR.JWT_AUTHENTICATION_REQUIRED',
      });
    const splittedAuthorization = extractBearer(request.headers.authorization);
    if (!splittedAuthorization?.trim())
      throw HTTP.unauthorized({
        message: 'AUTHENTICATION_ERROR.JWT_AUTHENTICATION_REQUIRED',
      });
    try {
      request.jwt = verifyJWT(splittedAuthorization) as FastifyRequest['jwt'];
    } catch (error) {
      throw HTTP.unauthorized({
        message: 'AUTHENTICATION_ERROR.INVALID_JWT',
      });
    }
  });
  done();
});
