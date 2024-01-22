import {
  type RawReplyDefaultExpression,
  type RawRequestDefaultExpression,
  type RawServerDefault,
  type RouteGenericInterface,
  type RouteHandlerMethod,
  type RouteShorthandOptions,
} from 'fastify';
import { z } from 'zod';
import { JsonSchema7ObjectType, zodToJsonSchema } from 'zod-to-json-schema';

export type APIOptions<RouteInterface extends RouteGenericInterface = RouteGenericInterface> = RouteShorthandOptions<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  RouteInterface
>;

export type APIHandler<RouteInterface extends RouteGenericInterface = RouteGenericInterface> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  RouteInterface
>;

const mapZodError = (zodError: z.ZodError, prefix: string) =>
  zodError.errors.map((issue) => `Error at ${prefix}->${issue.path.join('->')}`).join(';\n');

export type Tag = 'application' | 'contact';

export type BaseZodSchema = {
  Body?: z.ZodTypeAny;
  Params?: z.ZodTypeAny;
  Query?: z.ZodTypeAny;
  Headers?: z.ZodTypeAny;
  Reply: z.AnyZodObject;
  Security?: ({ bearerAuth: [] } | { apikeyAuth: [] })[];
  Tags?: Tag[];
};
export type FastifyZodSchema<TZodSchema extends BaseZodSchema> = {
  Body: TZodSchema['Body'] extends z.ZodTypeAny ? z.infer<TZodSchema['Body']> : undefined;
  Params: TZodSchema['Params'] extends z.ZodTypeAny ? z.infer<TZodSchema['Params']> : undefined;
  Querystring: TZodSchema['Query'] extends z.ZodTypeAny ? z.infer<TZodSchema['Query']> : undefined;
  Reply: TZodSchema['Reply'] extends z.ZodTypeAny
  ? z.infer<TZodSchema['Reply']>[keyof z.infer<TZodSchema['Reply']>]
  : undefined;
};

const parse = async (schema: z.ZodTypeAny, payload: any, tag: string) => {
  const result = await schema.safeParseAsync(payload);
  return {
    ...result,
    tag,
  };
};

export const route = <
  TSchema extends BaseZodSchema,
  FastifySchema extends FastifyZodSchema<TSchema> = FastifyZodSchema<TSchema>,
>(
    schema: TSchema,
    handler: APIHandler<FastifySchema>,
    _opts?: { debug: boolean },
  ): APIOptions<FastifySchema> & { handler: APIHandler<FastifySchema> } => {
  const finalResult: {
    body?: Record<string, unknown>;
    params?: Record<string, unknown>;
    querystring?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    response?: Record<number, unknown>;
    security?: any;
  } = {
    ...(schema.Body && { body: zodToJsonSchema(schema.Body) }),
    ...(schema.Params && { params: zodToJsonSchema(schema.Params) }),
    ...(schema.Query && { querystring: zodToJsonSchema(schema.Query) }),
    ...(schema.Headers && { headers: zodToJsonSchema(schema.Headers) }),
    response: (zodToJsonSchema(schema.Reply.partial()) as JsonSchema7ObjectType)['properties'],
    ...(schema.Security && { security: schema.Security }),
    ...(schema.Tags && { tags: schema.Tags }),
  };

  return {
    schema: finalResult,
    handler,
    preHandler: async (request, reply) => {
      const results = await Promise.all([
        ...(schema.Body ? [parse(schema.Body, request.body, 'body')] : []),
        ...(schema.Params ? [parse(schema.Params, request.params, 'params')] : []),
        ...(schema.Query ? [parse(schema.Query, request.query, 'query')] : []),
      ]);

      for (const result of results) {
        if (!result.success) {
          return reply
            .code(400 as any)
            .type('application/json')
            .send({
              message: mapZodError(result.error, result.tag),
            } as any);
        }
      }

      request.body = (results.find((r) => r.tag === 'body') as any)?.data || {};
      request.params = (results.find((r) => r.tag === 'params') as any)?.data || {};
      request.query = (results.find((r) => r.tag === 'query') as any)?.data || {};
    },
    onSend: (_request, reply, payload, done) => {
      const foundCode = Object.entries(schema.Reply.shape).find(([key]) =>
        typeof key === 'string' ? parseInt(key, 10) === reply.statusCode : key === reply.statusCode,
      );
      if (!foundCode) return done(null, payload);
      const parsed = JSON.parse(payload as string);
      const serialized = (foundCode[1] as z.AnyZodObject).safeParse(parsed);
      if (serialized.success) {
        return done(null, JSON.stringify(serialized.data));
      }
      return done(
        null,
        JSON.stringify({
          message: mapZodError(serialized.error, 'reply'),
        }),
      );
    },
  };
};
