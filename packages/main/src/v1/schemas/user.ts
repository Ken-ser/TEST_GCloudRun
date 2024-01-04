import { z } from 'zod';

export const loginArgs = z
  .object({
    email: z.string(),
    password: z.string(),
  })
  .required();

export const loginResponse = z
  .object({
    jwt: z.string(),
  })
  .required();
