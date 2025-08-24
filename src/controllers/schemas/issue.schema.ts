import { z } from 'zod';

export const createIssueBodySchema = z.object({
  fields: z.object({
    summary: z.string().min(3).max(255),
    issuetype: z.object({
      name: z.string(),
    }),
    parent: z.object({
      key: z.string(),
    }).optional(),
    reporterKey: z.string().optional(),
    assigneeKey: z.string().optional(),
    description: z.string().optional(),
  }),
});

const createIssueBodySchemaInternal = z.object({
  fields: z.object({
    summary: z.string().min(3).max(255),
    issuetype: z.object({
      id: z.string(),
    }),
    parent: z.object({
      key: z.string(),
    }).optional(),
    reporterKey: z.string().optional(),
    assigneeKey: z.string().optional(),
    description: z.string().optional(),
  }),
});

export type CreateIssueInput = z.infer<typeof createIssueBodySchemaInternal>;

export const updateAssigneeBodySchema = z.object({
  key: z.string().nullable(),
});

export type UpdateAssigneeInput = z.infer<typeof updateAssigneeBodySchema>;

export const updateIssueBodySchema = z.object({
  fields: z.object({
    summary: z.string().optional(),
    description: z.string().optional(),
    reporterKey: z.string().optional(),
    assigneeKey: z.string().optional(),
    priority: z.string().optional(),
    issuetype: z.object({
      name: z.string()
    }).optional()
  }).optional()
});
