import { Issue } from '../db/entities/issue.entity';

export class IssueService {
    async createIssue(summary: string): Promise<Issue> {
        // Placeholder implementation
        return { id: 1, key: 'TEST-1', summary } as Issue;
    }

    async getIssue(issueKey: string): Promise<Issue | null> {
        // Placeholder implementation
        if (issueKey === 'NON-EXISTENT-ISSUE') {
            return null;
        }
        return { id: 1, key: issueKey, summary: 'Test issue' } as Issue;
    }

    async deleteIssue(issueKey: string): Promise<void> {
        // Placeholder implementation
    }
}
