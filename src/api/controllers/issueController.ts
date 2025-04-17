import { Request, Response, NextFunction } from 'express';
import { Issue } from '../models/issue';
import { Attachment } from '../models/attachment';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { db } from '../../config/db';
import { IssueKeyService } from '../services/issueKeyService';

export const issueController = {
  async addAttachment(
    req: Request, 
    res: Response, 
    next: NextFunction
  ) {
    try {
      const { issueIdOrKey } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const issueId = await IssueKeyService.getIssueId(issueIdOrKey);

      if (!issueId) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      const { originalname, mimetype, buffer, size } = req.file;

      // Start a transaction
      await db.transaction(async (tx) => {
        const attachment = await tx.run(
          'INSERT INTO Attachments (issue_id, filename, mime_type, content, size) VALUES (?, ?, ?, ?, ?)',
          [issueId, originalname, mimetype, buffer, size]
        );

        const attachmentId = attachment.lastID;

        await tx.run(
          'UPDATE Issues SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [issueId]
        );

        const createdAttachment = await new Promise<Attachment>((resolve, reject) => {
            tx.get(
                'SELECT id, issue_id, filename, mime_type, size, created_at FROM Attachments WHERE id = ?',
                [attachmentId],
                (err: any, row: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });

        const attachmentResponse = {
          id: createdAttachment.id,
          self: `/rest/api/3/attachments/${createdAttachment.id}`,
          filename: createdAttachment.filename,
          mimeType: createdAttachment.mime_type,
          size: createdAttachment.size,
          created: createdAttachment.created_at,
        };

        res.status(200).json(attachmentResponse);
      });
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      next(error);
    }
  },
};
