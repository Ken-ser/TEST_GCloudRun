import { z } from 'zod';

export const applicationArgs = z
  .object({
    email: z.string(),
    password: z.string(),
  })
  .required();

export const applicationResponse = z
  .object({
    message: z.string(),
  })
  .required();
