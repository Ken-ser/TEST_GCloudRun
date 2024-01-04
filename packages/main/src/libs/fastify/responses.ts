/* eslint-disable @typescript-eslint/no-floating-promises */
import { type FastifyPluginCallback, type FastifyReply } from 'fastify';
import { PluginMetadata } from 'fastify-plugin';

const statusCode = (statusCode: number, defaultPayload: any) =>
  function (this: FastifyReply, payload: any) {
    const parsedPayload = payload ?? defaultPayload;
    if (typeof parsedPayload == 'string') throw new Error('response payload must be an object');
    // eslint-disable-next-line no-invalid-this, @typescript-eslint/no-floating-promises
    this.type('application/json');
    // eslint-disable-next-line no-invalid-this
    this.code(statusCode);
    // eslint-disable-next-line no-invalid-this
    const serialized = this.serialize(parsedPayload);
    if (serialized == `"[object Object]"`) throw new Error(`response schema didn't expect an object`);
    // eslint-disable-next-line no-invalid-this, @typescript-eslint/no-floating-promises
    this.send(serialized);
  };

const responses: FastifyPluginCallback = (fastify: any, _options: PluginMetadata, done) => {
  fastify.decorateReply('ok', statusCode(200, { message: 'ok' }));
  fastify.decorateReply('created', statusCode(201, { message: 'created' }));
  fastify.decorateReply('accepted', statusCode(202, { message: 'accepted' }));
  fastify.decorateReply('noContent', statusCode(204, { message: 'noContent' }));
  fastify.decorateReply('badRequest', statusCode(400, { message: 'badRequest' }));
  fastify.decorateReply('unauthorized', statusCode(401, { message: 'unauthorized' }));
  fastify.decorateReply('forbidden', statusCode(403, { message: 'forbidden' }));
  fastify.decorateReply('notFound', statusCode(404, { message: 'notFound' }));
  fastify.decorateReply('notAcceptable', statusCode(407, { message: 'notAcceptable' }));
  fastify.decorateReply('conflict', statusCode(409, { message: 'conflict' }));
  fastify.decorateReply('internalServerError', statusCode(500, { message: 'internalServerError' }));
  done();
};

const createResponse = (statusCode: number) => (message: { statusCode?: number | undefined; message: string }) => {
  const customError = new Error() as any;
  if (message.statusCode) {
    customError.statusCode = message.statusCode;
  } else {
    customError.statusCode = statusCode;
  }

  if (typeof message === 'string') customError.message = message;
  else customError.message = message.message;

  return customError;
};

const HTTP = {
  badRequest: createResponse(400),
  unauthorized: createResponse(401),
  forbidden: createResponse(403),
  notFound: createResponse(404),
  notAcceptable: createResponse(407),
  conflict: createResponse(409),
  internalServerError: createResponse(500),
};

export { HTTP, responses };
