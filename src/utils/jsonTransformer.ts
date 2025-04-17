import { Issue } from '../api/models/issue';
import { Attachment } from '../api/models/attachment';
import { db } from '../config/db';

interface IssueResponse {
    id: number;
    key: string;
    self: string;
    fields: {
        summary: string;
        [key: string]: any;
    };
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

    return issueResponse;
}
