import { z } from 'zod';

export const boardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
});

export type Board = z.infer<typeof boardSchema>;