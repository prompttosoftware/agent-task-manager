import { z } from 'zod';

export const createIssueSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(3),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('OPEN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  reporterId: z.string().uuid().optional(), // Assuming reporterId is a UUID
  assigneeId: z.string().uuid().optional(), // Assuming assigneeId is a UUID and optional
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
