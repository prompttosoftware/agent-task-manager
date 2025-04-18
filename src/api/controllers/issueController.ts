import { Request, Response } from 'express';
import { DatabaseService } from '../../services/databaseService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { Issue } from '../../models/issue';

interface IssueController {
    getIssue(req: Request, res: Response): Promise<void>;
}

export class IssueController implements IssueController {
    private databaseService: DatabaseService;

    constructor(databaseService: DatabaseService) {
        this.databaseService = databaseService;
    }
    async getIssue(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;

        try {
            let issue: Issue | undefined;

            // Attempt to retrieve the issue by ID (assuming it's a number)
            if (!isNaN(Number(issueIdOrKey))) {
                issue = await this.databaseService.get<Issue>(
                    'SELECT * FROM issues WHERE id = ?',
                    [issueIdOrKey]
                );
            } else {
                // If it's not a number, assume it's the issue key
                issue = await this.databaseService.get<Issue>(
                    'SELECT * FROM issues WHERE key = ?',
                    [issueIdOrKey]
                );
            }

            if (issue) {
                const formattedIssue = formatIssueResponse(issue);
                res.status(200).json(formattedIssue);
            } else {
                res.status(404).json({ message: 'Issue not found' });
            }
        } catch (error) {
            console.error('Error retrieving issue:', error);
            res.status(500).json({ message: 'Failed to retrieve issue' });
        }
    }
}

// Export singleton instance
const databaseService = new DatabaseService();
export const issueController = new IssueController(databaseService);