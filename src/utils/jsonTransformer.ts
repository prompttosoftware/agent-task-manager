import { Issue } from '../models/issue';
import { Attachment } from '../api/models/attachment';
import { db } from '../config/db';

interface IssueResponse {
    id: number;
    key: string;
    self: string;
    fields: {
        summary: string;
        assignee?: any;
        issuelinks?: any[];
        [key: string]: any;
    };
}

interface IssueLink {
    id: number;
    link_type: string;
    source_issue_id: number;
    target_issue_id: number;
}

interface LinkedIssueDetails {
    id: number;
    key: string;
    self: string;
    fields: {
        summary: string;
        status: {
            name: string;
        };
        issuetype: {
            name: string;
        };
    };
}

async function fetchIssueDetails(issueId: number): Promise<LinkedIssueDetails | null> {
    return new Promise((resolve, reject) => {
        db.get<any>(
            'SELECT id, key, summary, status, issuetype FROM Issues WHERE id = ?', // Assuming 'status' and 'issuetype' are stored directly in the Issues table.
            [issueId],
            (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    resolve(null);
                    return;
                }

                const issueDetails: LinkedIssueDetails = {
                    id: row.id,
                    key: row.key,
                    self: `/rest/api/3/issue/${row.key}`,
                    fields: {
                        summary: row.summary,
                        status: {
                            name: row.status,
                        },
                        issuetype: {
                            name: row.issuetype,
                        },
                    },
                };
                resolve(issueDetails);
            }
        );
    });
}

export async function formatIssueResponse(issue: Issue): Promise<IssueResponse> {
    const issueResponse: IssueResponse = {
        id: issue.id,
        key: issue.key,
        self: `/rest/api/3/issue/${issue.key}`,
        fields: {
            summary: issue.summary,
        },
    };

    if (issue.assignee_key !== null) {
        issueResponse.fields.assignee = {
            key: issue.assignee_key,
            name: issue.assignee_key,
            displayName: issue.assignee_key,
        };
    } else {
        issueResponse.fields.assignee = null;
    }

    // Fetch attachments
    const attachments: Attachment[] = await new Promise((resolve, reject) => {
        db.all<Attachment[]>(
            'SELECT id, filename, mime_type, size, created_at FROM Attachments WHERE issue_id = ?', 
            [issue.id],
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            }
        );
    });

    if (attachments && attachments.length > 0) {
        issueResponse.fields.attachment = attachments.map(attachment => ({
            id: attachment.id,
            self: `/rest/api/3/attachments/${attachment.id}`,
            filename: attachment.filename,
            mimeType: attachment.mime_type,
            size: attachment.size,
            created: attachment.created_at,
        }));
    } else {
        issueResponse.fields.attachment = [];
    }

    // Fetch issue links
    const issueLinks: IssueLink[] = await new Promise((resolve, reject) => {
        db.all<IssueLink[]>(
            'SELECT id, link_type, source_issue_id, target_issue_id FROM IssueLinks WHERE source_issue_id = ? OR target_issue_id = ?',
            [issue.id, issue.id],
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            }
        );
    });

    if (issueLinks && issueLinks.length > 0) {
        issueResponse.fields.issuelinks = [];
        for (const link of issueLinks) {
            const linkedIssueId = link.source_issue_id === issue.id ? link.target_issue_id : link.source_issue_id;

            const linkedIssueDetails = await fetchIssueDetails(linkedIssueId);

            if (linkedIssueDetails) {
                const linkDetails: any = {
                    id: link.id,
                    self: `/rest/api/3/issueLink/${link.id}`,
                    type: {
                        name: link.link_type, // Assuming link_type directly reflects the link type name
                    },
                };

                if (link.source_issue_id === issue.id) {
                    linkDetails.outwardIssue = linkedIssueDetails;
                } else {
                    linkDetails.inwardIssue = linkedIssueDetails;
                }

                issueResponse.fields.issuelinks.push(linkDetails);
            }
        }
    } else {
        issueResponse.fields.issuelinks = [];
    }

    return issueResponse;
}
