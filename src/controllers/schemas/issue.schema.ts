import { z } from 'zod';

export const createIssueBodySchema = z.object({
  fields: z.object({
    summary: z.string().min(3).max(255),
    issuetype: z.object({
      id: z.string(),
    }),
    reporterKey: z.string().optional(),
    assigneeKey: z.string().optional(),
    description: z.string().optional(),
  }),
});

export type CreateIssueInput = z.infer<typeof createIssueBodySchema>;

export const updateAssigneeBodySchema = z.object({
  key: z.string().nullable(),
});

export type UpdateAssigneeInput = z.infer<typeof updateAssigneeBodySchema>;
