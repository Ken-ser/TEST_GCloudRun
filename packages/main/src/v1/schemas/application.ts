import { z } from 'zod';

export const applicationArgs = z.object({
  cv: z.instanceof(Buffer),
  name: z.string(),
  surname: z.string(),
  email: z.string().email(),
  position: z.enum(['be', 'fe']),
  motivation: z.string(),
});

export const applicationResponse = z
  .object({
    message: z.string(),
  })
  .required();
