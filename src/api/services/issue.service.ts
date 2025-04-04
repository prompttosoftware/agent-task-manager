import { Issue } from '../types/issue.d';
import db from '../db/database';

export const issueService = {
    async getIssue(issueKey: string): Promise<Issue | undefined> {
        try {
            const issue = db.prepare('SELECT * FROM Issues WHERE issue_key = ?').get(issueKey) as Issue | undefined;
            return issue;
        } catch (error: any) {
            console.error('Error fetching issue:', error);
            throw new Error(`Failed to get issue: ${error.message}`);
        }
    }
};