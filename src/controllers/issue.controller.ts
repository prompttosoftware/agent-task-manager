import { Request, Response } from 'express';
import { IssueService } from '../services/issue.service'; // Assuming this path
import { logger } from '../utils/logger';
import { z } from 'zod';

// Define the schema for POST /rest/api/2/issue (Example - replace with actual schema)
const createIssueSchema = z.object({
    summary: z.string(),
    description: z.string().optional(),
    // Add other fields as needed
});

export class IssueController {
    static async createIssue(req: Request, res: Response) {
        try {
            const parsedBody = createIssueSchema.safeParse(req.body);
            if (!parsedBody.success) {
                logger.warn({ message: 'Validation error', errors: parsedBody.error.errors });
                return res.status(400).json({ errors: parsedBody.error.errors });
            }

            // Assuming IssueService.create will be implemented later
            const issue = await IssueService.create(parsedBody.data);
            return res.status(201).json(issue); // 201 Created
        } catch (error: any) {
            logger.error({ message: 'Error creating issue', error });
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getIssue(req: Request, res: Response) {
        try {
            const { issueKey } = req.params;

            // Assuming IssueService.get will be implemented later
            const issue = await IssueService.get(issueKey);

            if (!issue) {
                return res.status(404).json({ message: 'Issue not found' });
            }

            return res.status(200).json(issue); // 200 OK
        } catch (error: any) {
            logger.error({ message: 'Error getting issue', error });
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async deleteIssue(req: Request, res: Response) {
        try {
            const { issueKey } = req.params;

            // Assuming IssueService.delete will be implemented later
            await IssueService.delete(issueKey);

            return res.status(204).send(); // 204 No Content
        } catch (error: any) {
            if (error instanceof Error && error.message === 'Issue not found') {
                return res.status(404).json({ message: 'Issue not found' });
            }
            logger.error({ message: 'Error deleting issue', error });
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async createAttachment(req: Request, res: Response) {
        logger.info('Handling attachment creation');
        return res.status(200).send();
    }
}
