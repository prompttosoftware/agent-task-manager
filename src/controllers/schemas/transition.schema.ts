import { z } from 'zod';

export const transitionSchema = z.object({
  transition: z.object({
    id: z.string(),
  }),
});

export type TransitionSchema = z.infer<typeof transitionSchema>;
