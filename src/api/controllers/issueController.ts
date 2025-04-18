import { Request, Response } from 'express';
import { DatabaseService } from '../../services/databaseService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { Issue } from '../../models/issue';
import { IssueKeyService } from '../../services/issueKeyService';
import { WebhookService } from '../../services/webhookService'; // Import WebhookService

interface IssueController {
    getIssue(req: Request, res: Response): Promise<void>;
    createIssue(req: Request, res: Response): Promise<void>;
    deleteIssue(req: Request, res: Response): Promise<void>;
    updateIssue(req: Request, res: Response): Promise<void>;
    transitionIssue(req: Request, res: Response): Promise<void>;
    updateAssignee(req: Request, res: Response): Promise<void>;
    addAttachment(req: Request, res: Response): Promise<void>;
    linkIssues(req: Request, res: Response): Promise<void>;
}

export class IssueController implements IssueController {
    private databaseService: DatabaseService;
    private issueKeyService: IssueKeyService;
    private webhookService: WebhookService;

    constructor(databaseService: DatabaseService, issueKeyService: IssueKeyService, webhookService: WebhookService) {
        this.databaseService = databaseService;
        this.issueKeyService = issueKeyService;
        this.webhookService = webhookService;
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
                await this.webhookService.triggerWebhooks('jira:issue_created', formattedIssue);
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
                const formattedIssue = formatIssueResponse(updatedIssue);
                await this.webhookService.triggerWebhooks('jira:issue_updated', formattedIssue);
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

            const preDeleteIssue = await this.databaseService.get<Issue>(
                `SELECT * FROM issues WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`,
                [issueIdOrKey]
            );

            await this.databaseService.run(sql, params);

            if (preDeleteIssue) {
              const preDeleteFormattedIssue = formatIssueResponse(preDeleteIssue);
              await this.webhookService.triggerWebhooks('jira:issue_deleted', preDeleteFormattedIssue);
            }

            res.status(204).send(); // 204 No Content - successful deletion
        } catch (error) {
            console.error('Error deleting issue:', error);
            res.status(500).json({ message: 'Failed to delete issue' });
        }
    }

    async transitionIssue(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
        const { transition } = req.body; // Expecting a 'transition' field in the body

        try {
            // Update the issue's status in the database.
            const sql = `UPDATE issues SET status = ? WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`;
            const params = [transition, issueIdOrKey];
            await this.databaseService.run(sql, params);

            // Retrieve the updated issue
            const updatedIssue = await this.databaseService.get<Issue>(
                `SELECT * FROM issues WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`,
                [issueIdOrKey]
            );

            if (updatedIssue) {
                const formattedIssue = formatIssueResponse(updatedIssue);
                await this.webhookService.triggerWebhooks('jira:issue_updated', formattedIssue);
            }

            res.status(204).send(); // 204 No Content
        } catch (error) {
            console.error('Error transitioning issue:', error);
            res.status(500).json({ message: 'Failed to transition issue' });
        }
    }

    async updateAssignee(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
        const { assignee } = req.body; // Expecting an 'assignee' field in the body

        try {
            // Retrieve the issue before the update
            const preUpdateIssue = await this.databaseService.get<Issue>(
                `SELECT * FROM issues WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`,
                [issueIdOrKey]
            );

            if (!preUpdateIssue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }

            // Update the assignee in the database
            const sql = `UPDATE issues SET assignee_key = ? WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`;
            await this.databaseService.run(sql, [assignee, issueIdOrKey]);

            // Retrieve the updated issue
            const updatedIssue = await this.databaseService.get<Issue>(
                `SELECT * FROM issues WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`,
                [issueIdOrKey]
            );

            if (updatedIssue) {
                const formattedIssue = formatIssueResponse(updatedIssue);
                await this.webhookService.triggerWebhooks('jira:issue_updated', formattedIssue);
            }

            res.status(204).send(); // 204 No Content
        } catch (error) {
            console.error('Error updating assignee:', error);
            res.status(500).json({ message: 'Failed to update assignee' });
        }
    }

    async addAttachment(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
        const { attachment } = req.body; // Expecting an 'attachment' field in the body

        try {
            // Fetch the issue to get the issue key
            const issue = await this.databaseService.get<Issue>(
                `SELECT * FROM issues WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`,
                [issueIdOrKey]
            );

            if (!issue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }

            const issueKey = issue.key;

            // Implement logic to store attachment metadata (e.g., in a separate `attachments` table linked to the issue)
            const attachmentData = {
                issueIdOrKey,
                filename: attachment.filename, // Assuming 'attachment' has a filename property.
                url: attachment.url, // Assuming 'attachment' has a url property.
                // Add other attachment metadata as needed
            };

            // Example: Insert attachment metadata into an 'attachments' table
            const attachmentSql = `INSERT INTO attachments (issue_key, filename, url) VALUES (?, ?, ?)`;
            const attachmentParams = [issueKey, attachmentData.filename, attachmentData.url];
            await this.databaseService.run(attachmentSql, attachmentParams);

            // Optionally, update the issue record (e.g., update timestamp).
            const updateIssueSql = `UPDATE issues SET updated_at = ? WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`;
            const updateIssueParams = [new Date().toISOString(), issueIdOrKey];
            await this.databaseService.run(updateIssueSql, updateIssueParams);

             const updatedIssue = await this.databaseService.get<Issue>(
                `SELECT * FROM issues WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`,
                [issueIdOrKey]
            );

            if (updatedIssue) {
                const formattedIssue = formatIssueResponse(updatedIssue);
                await this.webhookService.triggerWebhooks('jira:issue_updated', formattedIssue);
            }

            res.status(201).json({ message: 'Attachment added successfully' });
        } catch (error) {
            console.error('Error adding attachment:', error);
            res.status(500).json({ message: 'Failed to add attachment' });
        }
    }

    async linkIssues(req: Request, res: Response): Promise<void> {
      const { issueIdOrKey } = req.params;
      const { linkedIssueKey, linkType } = req.body;

      try {
          // Retrieve the source issue
          const sourceIssue = await this.databaseService.get<Issue>(
              `SELECT * FROM issues WHERE ${isNaN(Number(issueIdOrKey)) ? 'key' : 'id'} = ?`,
              [issueIdOrKey]
          );

          if (!sourceIssue) {
              res.status(404).json({ message: 'Source issue not found' });
              return;
          }

          // Retrieve the linked issue
          const linkedIssue = await this.databaseService.get<Issue>(
              `SELECT * FROM issues WHERE key = ?`,
              [linkedIssueKey]
          );

          if (!linkedIssue) {
              res.status(404).json({ message: 'Linked issue not found' });
              return;
          }

          // Implement logic to store the link relationship (e.g., in a separate `issue_links` table).
          const linkSql = `INSERT INTO issue_links (source_issue_key, linked_issue_key, link_type) VALUES (?, ?, ?)`;
          const linkParams = [sourceIssue.key, linkedIssueKey, linkType];
          await this.databaseService.run(linkSql, linkParams);

          const formattedSourceIssue = formatIssueResponse(sourceIssue);
          const formattedLinkedIssue = formatIssueResponse(linkedIssue);

          await this.webhookService.triggerWebhooks('jira:issue_updated', {
              sourceIssue: formattedSourceIssue,
              linkedIssue: formattedLinkedIssue,
              linkType: linkType
          });

          res.status(200).json({ message: 'Issues linked successfully' });

      } catch (error) {
          console.error('Error linking issues:', error);
          res.status(500).json({ message: 'Failed to link issues' });
      }
  }
}

// Export singleton instance
import { DatabaseService } from '../../services/databaseService';
const databaseService = new DatabaseService();
import { IssueKeyService } from '../../services/issueKeyService';
const issueKeyService = new IssueKeyService(databaseService);
import { WebhookService } from '../../services/webhookService';
const webhookService = new WebhookService();
export const issueController = new IssueController(databaseService, issueKeyService, webhookService);