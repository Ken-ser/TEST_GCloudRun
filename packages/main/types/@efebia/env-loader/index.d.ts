import '@efebia/env-loader';
import { Declaration } from './env.js';

declare module '@efebia/env-loader' {
  export interface EnvSchema extends Declaration {}
}
