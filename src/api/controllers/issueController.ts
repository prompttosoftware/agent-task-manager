import { Request, Response } from 'express';
import { z } from 'zod';

const createIssueSchema = z.object({
  fields: z.object({
    summary: z.string().min(1, 'Summary is required.'),
    description: z.string().min(1, 'Description is required.'),
    priority: z.string().optional(),
    issuetype: z.object({
      name: z.enum(["Bug", "Task", "Story"], {
        errorMap: () => ({ message: "Issue type must be 'Bug', 'Task', or 'Story'." }),
      }),
    }),
  }),
  parent: z.object({ key: z.string().min(1, 'Parent key is required when parent is provided.') }).optional(),
});

/**
 * Handles the creation of a new issue.
 * Expects a nested request body structure defined by `createIssueSchema`.
 * Validates the request body using Zod against the `createIssueSchema`.
 *
 * @param {Request} req - The Express Request object. Expected body structure is defined by `createIssueSchema`:
 *   `{ fields: { summary: string, description: string, priority?: string, issuetype: { name: "Bug" | "Task" | "Story" } }, parent?: object }`.
 * @param {Response} res - The Express Response object.
 * @returns {void} Sends a JSON response:
 *   - Status 200: { message: 'Issue created successfully' } on success.
 *   - Status 400: { errors: ZodError[] } on Zod validation failure.
 *   - Status 500: { message: string } on other unexpected errors.
 */
export const createIssue = (req: Request, res: Response) => {
  try {
    // Validate and parse the request body using Zod
    const issue = createIssueSchema.parse(req.body);

    // If validation succeeds, proceed with creating the issue
    // In a real application, 'issue' would contain the validated data: { title, description, priority? }
    // This would interact with a database or external service using 'issue.title', 'issue.description', etc.
    // For now, we'll just return a success message.

    return res.status(200).json({ message: 'Issue created successfully' });

  } catch (error: any) {
    // If validation fails, return 400 with Zod errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};
