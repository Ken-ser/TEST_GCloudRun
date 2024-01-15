import 'fastify';

declare module 'fastify' {
  export interface FastifyRequest {
    jwt:
    | {
      _id: string;
    }
    | undefined;
  }

  export interface FastifyReply {
    ok: <T = { message: string }>(val?: T) => T;
    created: <T = { message: string }>(val?: T) => T;
    accepted: <T = { message: string }>(val?: T) => T;
    noContent: () => void;
    badRequest: (val: string) => { message: string };
    unauthorized: (val: string) => { message: string };
    forbidden: (val: string) => { message: string };
    notFound: (val: string) => { message: string };
    notAcceptable: (val: string) => { message: string };
    conflict: (val: string) => { message: string };
    internalServerError: (val?: string) => { message: string };
  }
}
