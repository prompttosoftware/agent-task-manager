import { Request, Response } from 'express';
import { DatabaseService } from '../../services/databaseService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { Issue } from '../../models/issue';
import { IssueKeyService } from '../../services/issueKeyService';
import { triggerWebhooks } from '../../services/webhookService'; // Import webhook service

interface IssueController {
    getIssue(req: Request, res: Response): Promise<void>;
    createIssue(req: Request, res: Response): Promise<void>;
    deleteIssue(req: Request, res: Response): Promise<void>;
    updateIssue(req: Request, res: Response): Promise<void>;
}

export class IssueController implements IssueController {
    private databaseService: DatabaseService;
    private issueKeyService: IssueKeyService;

    constructor(databaseService: DatabaseService, issueKeyService: IssueKeyService) {
        this.databaseService = databaseService;
        this.issueKeyService = issueKeyService;
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

    async createIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueData: Issue = req.body;

            // Basic validation
            if (!issueData.issuetype || !issueData.summary || !issueData.description) {
                res.status(400).json({ message: 'Missing required fields' });
                return;
            }

            const issueKey = await this.issueKeyService.getNextIssueKey();

            // SQL INSERT statement
            const sql = `
                INSERT INTO issues (issuetype, summary, description, parentKey, key)
                VALUES (?, ?, ?, ?, ?)
            `;

            const params = [
                issueData.issuetype,
                issueData.summary,
                issueData.description,
                issueData.parentKey,
                issueKey
            ];

            await this.databaseService.run(sql, params);

            // Retrieve the newly created issue
            const newIssue = await this.databaseService.get<Issue>(
                'SELECT * FROM issues WHERE key = ?',
                [issueKey]
            );

            if (newIssue) {
                const formattedIssue = formatIssueResponse(newIssue);
                res.status(201).json(formattedIssue); // 201 Created
            } else {
                res.status(500).json({ message: 'Failed to retrieve newly created issue' });
            }
        } catch (error) {
            console.error('Error creating issue:', error);
            res.status(500).json({ message: 'Failed to create issue' });
        }    
    }

    async updateIssue(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
        const updatedIssueData: Issue = req.body;

        try {
            let issueIdColumn = 'id';
            if (isNaN(Number(issueIdOrKey))) {
                issueIdColumn = 'key';
            }

            // Validate that at least one field to update is present
            if (!updatedIssueData.issuetype && !updatedIssueData.summary && !updatedIssueData.description && !updatedIssueData.parentKey) {
                res.status(400).json({ message: 'No fields to update provided' });
                return;
            }

            // Construct the SQL UPDATE statement
            let sql = `UPDATE issues SET `;
            const updates: string[] = [];
            const params: any[] = [];

            if (updatedIssueData.issuetype) {
                updates.push('issuetype = ?');
                params.push(updatedIssueData.issuetype);
            }
            if (updatedIssueData.summary) {
                updates.push('summary = ?');
                params.push(updatedIssueData.summary);
            }
            if (updatedIssueData.description) {
                updates.push('description = ?');
                params.push(updatedIssueData.description);
            }
            if (updatedIssueData.parentKey) {
                updates.push('parentKey = ?');
                params.push(updatedIssueData.parentKey);
            }

            sql += updates.join(', ');
            sql += ` WHERE ${issueIdColumn} = ?`;
            params.push(issueIdOrKey);

            await this.databaseService.run(sql, params);

            // Retrieve the updated issue
            const updatedIssue = await this.databaseService.get<Issue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );

            if (updatedIssue) {
                // Trigger the issue_updated webhook
                await triggerWebhooks('issue_updated', updatedIssue);
            } else {
                console.warn('Issue updated in DB but not found for webhook trigger.');
            }

            res.status(204).send(); // 204 No Content
        } catch (error) {
            console.error('Error updating issue:', error);
            res.status(500).json({ message: 'Failed to update issue' });
        }
    }

    async deleteIssue(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;

        try {
            let sql: string;
            let params: any[];

            // Determine if issueIdOrKey is an ID (number) or a key (string)
            if (!isNaN(Number(issueIdOrKey))) {
                sql = 'DELETE FROM issues WHERE id = ?';
                params = [issueIdOrKey];
            } else {
                sql = 'DELETE FROM issues WHERE key = ?';
                params = [issueIdOrKey];
            }

            await this.databaseService.run(sql, params);

            res.status(204).send(); // 204 No Content - successful deletion
        } catch (error) {
            console.error('Error deleting issue:', error);
            res.status(500).json({ message: 'Failed to delete issue' });
        }       
    }
}

// Export singleton instance
import { DatabaseService } from '../../services/databaseService';
const databaseService = new DatabaseService();
import { IssueKeyService } from '../../services/issueKeyService';
const issueKeyService = new IssueKeyService(databaseService);
export const issueController = new IssueController(databaseService, issueKeyService);