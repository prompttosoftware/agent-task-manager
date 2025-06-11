import { z } from 'zod';

export const createIssueSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(3),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  statusId: z.number().default(1),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
