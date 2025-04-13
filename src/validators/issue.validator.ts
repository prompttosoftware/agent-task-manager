import { z } from 'zod';

export const createIssueSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string().optional(),
    boardId: z.string({ required_error: 'Board ID is required' }),
    status: z.enum(['open', 'in progress', 'done']).default('open'),
  }),
});

export const getIssueSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Issue ID is required' }),
  }),
});

export const updateIssueSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Issue ID is required' }),
  }),
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    boardId: z.string().optional(),
    status: z.enum(['open', 'in progress', 'done']).optional(),
  }).refine(data => {
        const hasUpdateFields = data.title !== undefined || data.description !== undefined || data.boardId !== undefined || data.status !== undefined;
        return hasUpdateFields;
    }, {
        message: 'At least one field must be provided for update',
        path: ['body'],
    }),
});

export const deleteIssueSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Issue ID is required' }),
  }),
});