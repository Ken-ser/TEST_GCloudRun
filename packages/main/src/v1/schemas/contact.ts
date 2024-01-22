import { z } from 'zod';

export const contactArgs = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

export const contactResponse = z.object({
  message: z.string(),
});
