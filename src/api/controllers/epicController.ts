import { Request, Response, NextFunction } from 'express';
import { Issue } from '../../models/issue';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { triggerWebhooks } from '../../services/webhookService';

// Define the type expected from the database, including generated fields
type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };

export class EpicController {
    private readonly databaseService: DatabaseService;
    private readonly issueKeyService: IssueKeyService;

    constructor(databaseService: DatabaseService, issueKeyService: IssueKeyService) {
        this.databaseService = databaseService;
        this.issueKeyService = issueKeyService;
    }

    /**
     * Retrieves all issues with the type 'Epic'.
     */
    public async getEpics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const epics = await this.databaseService.all<DbIssue>(
                'SELECT * FROM issues WHERE issuetype = ?',
                ['Epic']
            );
            // Format response using the utility function
            const formattedEpics = epics.map(formatIssueResponse);
            res.json(formattedEpics);
        } catch (error: any) {
            console.error('Error getting epics:', error);
            next(new Error(`Failed to retrieve epics: ${error.message}`)); // Pass errors to the Express error handler
        }
    }

    /**
     * Creates a new issue with the type 'Epic'.
     */
    public async createEpic(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 1. Extract data from request body
            // We only need summary and description for an Epic from the body.
            // parentKey might sometimes be relevant for Epics, but often not. Let's include it as optional.
            const epicData = req.body as Pick<Issue, 'summary' | 'description' | 'parentKey'>;

            // 2. Validate required fields
            if (!epicData.summary || !epicData.description) {
                res.status(400).json({ message: 'Missing required fields: summary, description' });
                return;
            }

            // 3. Set fixed issuetype
            const issuetype = 'Epic';

            // 4. Generate the next issue key using the service
            const issueKey = await this.issueKeyService.getNextIssueKey();

            // 5. Prepare database insertion query
            const sql = `
              INSERT INTO issues (issuetype, summary, description, parentKey, key, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const now = new Date().toISOString();
            const defaultStatus = 'To Do'; // Assuming 'To Do' is the default initial status

            const params = [
              issuetype,                // Hardcoded 'Epic'
              epicData.summary,
              epicData.description,
              epicData.parentKey ?? null, // Use provided parentKey or null
              issueKey,                 // Generated key
              defaultStatus,            // Default status
              now,                      // created_at timestamp
              now                       // updated_at timestamp
            ];

            // 6. Execute the insert query using the database service
            await this.databaseService.run(sql, params);

            // 7. Retrieve the newly created epic from the database to return it
            const newEpic = await this.databaseService.get<DbIssue>(
              'SELECT * FROM issues WHERE key = ?',
              [issueKey]
            );

            // 8. Handle retrieval result
            if (newEpic) {
                // Format the response consistently using the utility function
                const formattedEpic = formatIssueResponse(newEpic);
                // 9. Trigger webhooks for issue creation
                await triggerWebhooks('jira:issue_created', formattedEpic);
                // 10. Send the successful response (201 Created)
                res.status(201).json(formattedEpic);
            } else {
                // This indicates an issue if the insert succeeded but retrieval failed
                console.error(`Failed to retrieve newly created epic with key ${issueKey} after insertion.`);
                res.status(500).json({ message: 'Failed to retrieve newly created epic after creation.' });
            }
        } catch (error: any) {
            // 11. Handle potential errors during the process
            console.error('Error creating epic:', error);
            // Pass the error to the Express error handling middleware
            next(new Error(`Failed to create epic: ${error.message}`));
        }
    }
}

// Note: You will need to instantiate this controller elsewhere in your application,
// likely where you define your Express routes, and provide the DatabaseService
// and IssueKeyService instances.
//
// Example (in your routing setup file):
//
// import { EpicController } from './api/controllers/epicController';
// import { databaseServiceInstance, issueKeyServiceInstance } from './services'; // Assuming you have instances available
//
// const epicController = new EpicController(databaseServiceInstance, issueKeyServiceInstance);
//
// router.get('/epics', (req, res, next) => epicController.getEpics(req, res, next));
// router.post('/epics', (req, res, next) => epicController.createEpic(req, res, next));