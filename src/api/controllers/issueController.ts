import { Request, Response } from 'express';
import { DatabaseService } from '../../services/databaseService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { Issue } from '../../models/issue';
import { IssueKeyService } from '../../services/issueKeyService';
import { triggerWebhooks } from '../../services/webhookService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';
import { Status } from '../../models/status'; // Import Status if needed for type safety, though not strictly necessary for the mapping logic below

interface IssueControllerInterface {
    getIssue(req: Request, res: Response): Promise<void>;
    createIssue(req: Request, res: Response): Promise<void>;
    deleteIssue(req: Request, res: Response): Promise<void>;
    updateIssue(req: Request, res: Response): Promise<void>;
    transitionIssue(req: Request, res: Response): Promise<void>;
    updateAssignee(req: Request, res: Response): Promise<void>;
    addAttachment(req: Request, res: Response): Promise<void>;
    linkIssues(req: Request, res: Response): Promise<void>;
}

export class IssueController implements IssueControllerInterface {
    private databaseService: DatabaseService;
    private issueKeyService: IssueKeyService;
    private issueStatusTransitionService: IssueStatusTransitionService; // Inject service

    constructor(
        databaseService: DatabaseService,
        issueKeyService: IssueKeyService,
        issueStatusTransitionService: IssueStatusTransitionService // Accept service in constructor
    ) {
        this.databaseService = databaseService;
        this.issueKeyService = issueKeyService;
        this.issueStatusTransitionService = issueStatusTransitionService; // Assign service

        this.getIssue = this.getIssue.bind(this);
        this.createIssue = this.createIssue.bind(this);
        this.addAttachment = this.addAttachment.bind(this);
        this.deleteIssue = this.deleteIssue.bind(this);
        this.getStatusIdFromName = this.getStatusIdFromName.bind(this);
        this.linkIssues = this.linkIssues.bind(this);
        this.transitionIssue = this.transitionIssue.bind(this);
        this.updateAssignee = this.updateAssignee.bind(this);
        this.updateIssue = this.updateIssue.bind(this);
    }

    // Helper to map status name to ID (based on IssueStatusTransitionService logic)
    private getStatusIdFromName(statusName: string): number | null {
        switch (statusName) {
            case 'To Do': return 11;
            case 'In Progress': return 21;
            case 'Done': return 31;
            default: return null; // Unknown status name
        }
    }

    async getIssue(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;

        try {
            type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
            let issue: DbIssue | undefined;


            if (!isNaN(Number(issueIdOrKey))) {
                issue = await this.databaseService.get<DbIssue>(
                    'SELECT * FROM issues WHERE id = ?',
                    [issueIdOrKey]
                );
            } else {
                issue = await this.databaseService.get<DbIssue>(
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
            const issueData = req.body as Pick<Issue, 'issuetype' | 'summary' | 'description' | 'parentKey' | 'key'>;

            if (!issueData.issuetype || !issueData.summary || !issueData.description) {
                res.status(400).json({ message: 'Missing required fields' });
                return;
            }

            const issueKey = await this.issueKeyService.getNextIssueKey();

            const sql = `
                INSERT INTO issues (issuetype, summary, description, parentKey, key, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const now = new Date().toISOString();
            const defaultStatus = 'To Do';

            const params = [
                issueData.issuetype,
                issueData.summary,
                issueData.description,
                issueData.parentKey ?? null,
                issueKey,
                defaultStatus,
                now,
                now
            ];

            await this.databaseService.run(sql, params);

             type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
            const newIssue = await this.databaseService.get<DbIssue>(
                'SELECT * FROM issues WHERE key = ?',
                [issueKey]
            );

            if (newIssue) {
                const formattedIssue = formatIssueResponse(newIssue);
                await triggerWebhooks('jira:issue_created', formattedIssue);
                res.status(201).json(formattedIssue);
            } else {
                res.status(500).json({ message: 'Failed to retrieve newly created issue' });
            }
        } catch (error) {
            //console.error('Error creating issue:', error);
            res.status(500).json({ message: 'Failed to create issue' });
        }
    }

    async updateIssue(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
         type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
        const updatedIssueData: Partial<DbIssue> = req.body;

        try {
            let issueIdColumn = 'id';
             if (isNaN(Number(issueIdOrKey))) {
                issueIdColumn = 'key';
            }

             const preUpdateIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );

            if (!preUpdateIssue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }


            const allowedUpdateFields: (keyof DbIssue)[] = ['issuetype', 'summary', 'description', 'parentKey', 'status', 'assignee_key'];
            const fieldsToUpdate = Object.keys(updatedIssueData).filter(
                key => allowedUpdateFields.includes(key as keyof DbIssue)
            );


            if (fieldsToUpdate.length === 0) {
                res.status(400).json({ message: 'No valid fields to update provided' });
                return;
            }

            // Status transition validation specific to updateIssue if status is being changed
            if (fieldsToUpdate.includes('status') && updatedIssueData.status) {
                const currentStatusId = this.getStatusIdFromName(preUpdateIssue.status);
                const targetStatusId = this.getStatusIdFromName(updatedIssueData.status);

                if (currentStatusId === null || targetStatusId === null) {
                    res.status(400).json({ message: `Invalid status name provided: Current='${preUpdateIssue.status}', Target='${updatedIssueData.status}'` });
                    return;
                }

                if (!this.issueStatusTransitionService.isValidTransition(currentStatusId, targetStatusId, this.databaseService)) {
                    res.status(400).json({ message: `Invalid status transition from '${preUpdateIssue.status}' to '${updatedIssueData.status}'` });
                    return;
                }
            }


            const updates: string[] = [];
            const params: any[] = [];

            fieldsToUpdate.forEach(key => {
                updates.push(`${key} = ?`);
                params.push(updatedIssueData[key as keyof DbIssue]);
            });

            updates.push('updated_at = ?');
            params.push(new Date().toISOString());


            let sql = `UPDATE issues SET ${updates.join(', ')} WHERE ${issueIdColumn} = ?`;
            params.push(issueIdOrKey);

            await this.databaseService.run(sql, params);

            const updatedIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );


            if (updatedIssue) {
                const formattedIssue = formatIssueResponse(updatedIssue);
                 await triggerWebhooks('jira:issue_updated', formattedIssue);
                res.status(204).send();
            } else {
                 console.error('Issue updated but could not be retrieved afterwards.');
                 res.status(500).json({ message: 'Failed to retrieve updated issue' });
            }

        } catch (error) {
            console.error('Error updating issue:', error);
            res.status(500).json({ message: 'Failed to update issue' });
        }
    }

    async deleteIssue(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;

        try {
            let issueIdColumn = 'id';
             if (isNaN(Number(issueIdOrKey))) {
                issueIdColumn = 'key';
            }

            type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
            const preDeleteIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );


            if (!preDeleteIssue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }

            const sql = `DELETE FROM issues WHERE ${issueIdColumn} = ?`;
            const params = [issueIdOrKey];

            await this.databaseService.run(sql, params);

            const preDeleteFormattedIssue = formatIssueResponse(preDeleteIssue);
             await triggerWebhooks('jira:issue_deleted', preDeleteFormattedIssue);


            res.status(204).send();
        } catch (error) {
            console.error('Error deleting issue:', error);
            res.status(500).json({ message: 'Failed to delete issue' });
        }
    }

    async transitionIssue(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
        const { transition } = req.body;

        if (!transition || !transition.name) {
             res.status(400).json({ message: 'Missing transition name in request body' });
             return;
        }

        const newStatusName = transition.name; // This is the target status name

        try {
            let issueIdColumn = 'id';
             if (isNaN(Number(issueIdOrKey))) {
                issueIdColumn = 'key';
            }

            // 1. Fetch the current issue
            type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
            const currentIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );

            if (!currentIssue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }

            // 2. Get current and target status IDs
            const currentStatusId = this.getStatusIdFromName(currentIssue.status);
            const targetStatusId = this.getStatusIdFromName(newStatusName);

            if (currentStatusId === null || targetStatusId === null) {
                res.status(400).json({ message: `Invalid status name provided: Current='${currentIssue.status}', Target='${newStatusName}'` });
                return;
            }

            // 3. Validate the transition using the injected service
            if (!this.issueStatusTransitionService.isValidTransition(currentStatusId, targetStatusId, this.databaseService)) {
                res.status(400).json({
                    message: `Invalid status transition from '${currentIssue.status}' to '${newStatusName}'`
                });
                return;
            }

            // 4. If valid, update the issue status in the database
            const sql = `UPDATE issues SET status = ?, updated_at = ? WHERE ${issueIdColumn} = ?`;
            const params = [newStatusName, new Date().toISOString(), issueIdOrKey];
            await this.databaseService.run(sql, params);

            // 5. Fetch the updated issue to return/trigger webhooks
            const updatedIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );

            if (updatedIssue) {
                 const formattedIssue = formatIssueResponse(updatedIssue);
                await triggerWebhooks('jira:issue_updated', formattedIssue); // Trigger update webhook
                res.status(204).send(); // Success, no content
            } else {
                 // This case should ideally not happen if the update was successful
                 console.error('Issue transitioned but could not be retrieved afterwards.');
                 res.status(500).json({ message: 'Failed to retrieve updated issue after transition' });
            }

        } catch (error) {
            console.error('Error transitioning issue:', error);
            res.status(500).json({ message: 'Failed to transition issue' });
        }
    }


    async updateAssignee(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
         const { assignee } = req.body;

        if (typeof assignee === 'undefined') {
             res.status(400).json({ message: 'Missing assignee key in request body (use null to unassign)' });
             return;
        }
        const newAssigneeKey = assignee;

        try {
            let issueIdColumn = 'id';
             if (isNaN(Number(issueIdOrKey))) {
                issueIdColumn = 'key';
            }
             type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
            const preUpdateIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );

            if (!preUpdateIssue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }


            const sql = `UPDATE issues SET assignee_key = ?, updated_at = ? WHERE ${issueIdColumn} = ?`;
            await this.databaseService.run(sql, [newAssigneeKey, new Date().toISOString(), issueIdOrKey]);


            const updatedIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );

            if (updatedIssue) {
                const formattedIssue = formatIssueResponse(updatedIssue);
                await triggerWebhooks('jira:issue_updated', formattedIssue);
                 res.status(204).send();
            } else {
                 console.error('Assignee updated but could not retrieve issue afterwards.');
                 res.status(500).json({ message: 'Failed to retrieve updated issue after assignee change' });
            }

        } catch (error) {
            console.error('Error updating assignee:', error);
            res.status(500).json({ message: 'Failed to update assignee' });
        }
    }

    async addAttachment(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
         const attachmentMetadata = req.body;


        if (!attachmentMetadata || !attachmentMetadata.filename || !attachmentMetadata.url) {
            res.status(400).json({ message: 'Missing attachment filename or url in request body' });
            return;
        }

        try {
            let issueIdColumn = 'id';
             if (isNaN(Number(issueIdOrKey))) {
                issueIdColumn = 'key';
            }

             type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
            const issue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${issueIdColumn} = ?`,
                [issueIdOrKey]
            );

            if (!issue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }

            const issueKey = issue.key;


            const attachmentSql = `INSERT INTO attachments (issue_key, filename, url, created_at) VALUES (?, ?, ?, ?)`;
            const attachmentParams = [issueKey, attachmentMetadata.filename, attachmentMetadata.url, new Date().toISOString()];
            const result = await this.databaseService.run(attachmentSql, attachmentParams);
            const newAttachmentId = (result as any)?.lastID;

            const updateIssueSql = `UPDATE issues SET updated_at = ? WHERE key = ?`;
            const updateIssueParams = [new Date().toISOString(), issueKey];
            await this.databaseService.run(updateIssueSql, updateIssueParams);

            const updatedIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE key = ?`,
                [issueKey]
            );

            if (updatedIssue) {
                 const formattedIssue = formatIssueResponse(updatedIssue);
                 await triggerWebhooks('jira:issue_updated', {
                    ...formattedIssue,
                    // Potentially add attachment info to webhook payload if needed
                 });

                 res.status(200).json({
                      id: newAttachmentId,
                      filename: attachmentMetadata.filename,
                      content: attachmentMetadata.url, // Should probably be 'url' to match input/db
                      created: new Date().toISOString(),
                      // Add other standard Jira attachment fields if needed
                  });
            } else {
                 console.error('Attachment added but could not retrieve updated issue afterwards.');
                 res.status(500).json({ message: 'Failed to retrieve updated issue after adding attachment' });
            }

        } catch (error) {
            console.error('Error adding attachment:', error);
            res.status(500).json({ message: 'Failed to add attachment' });
        }
    }

    async linkIssues(req: Request, res: Response): Promise<void> {
        const { issueIdOrKey } = req.params;
        const { linkedIssueKey, linkType } = req.body;

        if (!linkedIssueKey || !linkType) {
            res.status(400).json({ message: 'Missing linkedIssueKey or linkType in request body' });
            return;
        }

        try {
             type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
            let sourceIssueIdColumn = 'id';
             if (isNaN(Number(issueIdOrKey))) {
                sourceIssueIdColumn = 'key';
            }

            const sourceIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE ${sourceIssueIdColumn} = ?`,
                [issueIdOrKey]
            );

            if (!sourceIssue) {
                res.status(404).json({ message: 'Source issue not found' });
                return;
            }

            const linkedIssue = await this.databaseService.get<DbIssue>(
                `SELECT * FROM issues WHERE key = ?`,
                [linkedIssueKey]
            );

            if (!linkedIssue) {
                res.status(404).json({ message: 'Linked issue not found' });
                return;
            }


            const linkSql = `INSERT INTO issue_links (source_issue_key, linked_issue_key, link_type) VALUES (?, ?, ?)`;
            const linkParams = [sourceIssue.key, linkedIssueKey, linkType];
            const result = await this.databaseService.run(linkSql, linkParams);
            const linkId = (result as any)?.lastID; // Get the ID of the newly created link

            const now = new Date().toISOString();
            await this.databaseService.run(`UPDATE issues SET updated_at = ? WHERE key = ?`, [now, sourceIssue.key]);
            await this.databaseService.run(`UPDATE issues SET updated_at = ? WHERE key = ?`, [now, linkedIssue.key]);


            const updatedSourceIssue = await this.databaseService.get<DbIssue>('SELECT * FROM issues WHERE key = ?', [sourceIssue.key]);
            const updatedLinkedIssue = await this.databaseService.get<DbIssue>('SELECT * FROM issues WHERE key = ?', [linkedIssueKey]);


            if (!updatedSourceIssue || !updatedLinkedIssue) {
                console.error('Failed to retrieve issues after linking for webhook payload.');
                 // Link was created, but data retrieval failed. Still technically a success.
                 res.status(201).json({ message: 'Issues linked successfully, but failed to retrieve updated data for webhook.' });
                return;
            }

            // Construct a more standard Jira webhook payload for issue link creation
            const webhookPayload = {
                 timestamp: Date.now(),
                 webhookEvent: 'jira:issuelink_created',
                 issueLink: {
                     id: linkId, // Use the actual link ID
                     sourceIssueId: sourceIssue.id,
                     destinationIssueId: linkedIssue.id,
                     issueLinkType: {
                         id: 0, // We don't have link type IDs, using 0 placeholder
                         name: linkType,
                         inward: 'linked to', // Example, adjust as needed
                         outward: 'links', // Example, adjust as needed
                     }
                 },
                // Include minimal issue details if helpful for webhook consumers
                 // sourceIssue: { key: sourceIssue.key, id: sourceIssue.id },
                 // destinationIssue: { key: linkedIssue.key, id: linkedIssue.id }
             };

            await triggerWebhooks('jira:issuelink_created', webhookPayload);


            res.status(201).json({ message: 'Issues linked successfully' });

        } catch (error: any) {

            if (error.message?.includes('UNIQUE constraint failed')) {
                res.status(400).json({ message: 'Issue link already exists' });
            } else {
                console.error('Error linking issues:', error);
                res.status(500).json({ message: 'Failed to link issues' });
            }
        }
    }
}


// Instantiate services

// Instantiate controller with all dependencies
