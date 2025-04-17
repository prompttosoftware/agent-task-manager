export class IssueController {
    private databaseService: DatabaseService;
    private issueStatusTransitionService: IssueStatusTransitionService;
    private jsonTransformer: JsonTransformer;

    constructor(databaseService: DatabaseService, issueStatusTransitionService: IssueStatusTransitionService, jsonTransformer: JsonTransformer) {
        this.databaseService = databaseService;
        this.issueStatusTransitionService = issueStatusTransitionService;
        this.jsonTransformer = jsonTransformer;
    }

    async createIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueData = req.body;
            const newIssue = await this.databaseService.createIssue(issueData);
            res.status(201).json(this.jsonTransformer.transform(newIssue));
        } catch (error: any) {
            console.error("Error creating issue:", error);
            res.status(500).json({ message: error.message || 'Failed to create issue' });
        }
    }

    async getIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const issue = await this.databaseService.getIssue(issueKey);
            if (!issue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }
            res.status(200).json(this.jsonTransformer.transform(issue));
        } catch (error: any) {
            console.error("Error getting issue:", error);
            res.status(500).json({ message: error.message || 'Failed to get issue' });
        }
    }

    async deleteIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            await this.databaseService.deleteIssue(issueKey);
            res.status(204).send(); // No content on successful delete
        } catch (error: any) {
            console.error("Error deleting issue:", error);
            res.status(500).json({ message: error.message || 'Failed to delete issue' });
        }
    }

    async getTransitions(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const issue = await this.databaseService.getIssue(issueKey);
            if (!issue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }
            const currentStatusId = issue.status_id;
            const allowedTargetStatusIds: number[] = [];
            if (currentStatusId) {
                if (currentStatusId === 1) {
                   allowedTargetStatusIds.push(2);
                } else if (currentStatusId === 2) {
                  allowedTargetStatusIds.push(1, 3);
                } else if (currentStatusId === 3) {
                  allowedTargetStatusIds.push(1, 2);
                }
            }
            const statuses = await this.databaseService.getStatusesByIds(allowedTargetStatusIds);
            const transitions = statuses.map(status => ({
                id: status.id,
                name: status.name,
                to: {
                    id: status.id,
                    name: status.name,
                    statusCategory: {
                        id: status.code,
                        key: status.code,
                        name: status.name
                    }
                },
                fields: {}
            }));
            const response = {
                transitions: transitions
            };
            res.status(200).json(response);
        } catch (error: any) {
            console.error("Error getting transitions:", error);
            res.status(500).json({ message: error.message || 'Failed to get transitions' });
        }
    }

    async transitionIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const targetStatusId = req.body.transition?.id;

            if (!targetStatusId) {
                res.status(400).json({ message: 'Transition ID is required' });
                return;
            }

            const issue = await this.databaseService.getIssue(issueKey);

            if (!issue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }

            const currentStatusId = issue.status_id;

            const isValidTransition = this.issueStatusTransitionService.isValidTransition(currentStatusId, targetStatusId);

            if (!isValidTransition) {
                res.status(400).json({ message: 'Invalid transition' });
                return;
            }

            await this.databaseService.updateIssueStatus(issueKey, targetStatusId);

            res.status(204).send(); // No Content

        } catch (error: any) {
            console.error("Error transitioning issue:", error);
            res.status(500).json({ message: error.message || 'Failed to transition issue' });
        }
    }
}