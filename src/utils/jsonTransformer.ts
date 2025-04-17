// src/utils/jsonTransformer.ts

import { DatabaseService } from '../services/databaseService';
import { Status } from '../models/status';

export class JsonTransformer {
    private databaseService: DatabaseService;

    constructor(databaseService: DatabaseService) {
        this.databaseService = databaseService;
    }

    async transform(data: any, endpoint?: string): Promise<any> {
        if (endpoint === 'GET /issue/{issueIdOrKey}') {
            return await this.transformIssueDetails(data);
        }
        return data;
    }

    private async transformIssueDetails(issue: any): Promise<any> {
        if (!issue) {
            return issue;
        }

        let transformedIssue: any = { ...issue };

        if (issue.status_id) {
            try {
                const status: Status | undefined = await this.databaseService.getStatusById(issue.status_id);

                if (status) {
                    transformedIssue.status = {
                        id: status.id,
                        name: status.name,
                        category: {
                            id: status.id, // Assuming status.id can be used as category id
                            key: status.code, // Assuming status.code can be used as category key
                            name: status.name,
                            colorName: this.mapStatusToColor(status.code) // You'll need to implement this
                        }
                    };
                    delete transformedIssue.status_id; // Remove the original status_id
                }
            } catch (error) {
                console.error("Error fetching status details:", error);
                // Handle the error appropriately, e.g., log it and return a default status or null
                transformedIssue.status = null; // or a default status object
            }
        }

        return transformedIssue;
    }

    private mapStatusToColor(statusCode: string): string {
        // Implement your logic to map status code to color name
        // This is just a placeholder, replace with your actual mapping
        switch (statusCode) {
            case 'TODO':
                return 'blue';
            case 'IN_PROGRESS':
                return 'yellow';
            case 'DONE':
                return 'green';
            default:
                return 'gray';
        }
    }
}
