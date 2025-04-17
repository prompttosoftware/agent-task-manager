import { Issue } from '../models/issue';
import { Attachment } from '../models/attachment';
import { db } from '../config/db';

interface IssueResponse {
    expand: string;
    id: string;
    key: string;
    self: string;
    fields: {
        summary: string;
    };
    assignee_key?: string;
    summary?: string;
}

/**
 * Formats an issue object to a response object
 * @param issue
 * @returns {IssueResponse}
 */
export function formatIssueResponse(issue: Issue): IssueResponse {
    return {
        expand: "schema,names",
        id: issue.id,
        key: issue.key,
        self: `/rest/api/3/issue/${issue.key}`,
        assignee_key: issue.assignee_key,
        summary: issue.summary,
        fields: {
            summary: issue.summary,
        },
    };
}

export function formatIssuesResponse(issues: Issue[]): IssueResponse[] {
    return issues.map(issue => formatIssueResponse(issue));
}