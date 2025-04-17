import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db';

export const issueController = {
  async linkIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, inwardIssue, outwardIssue } = req.body;

      // Validate request body
      if (!type?.name || !inwardIssue?.key || !outwardIssue?.key) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      // Check link type
      if (type.name !== 'Relates') {
        return res.status(400).json({ error: 'Invalid link type. Only "Relates" is supported.' });
      }

      const inwardIssueKey = inwardIssue.key;
      const outwardIssueKey = outwardIssue.key;

      let inwardId: number | undefined;
      let outwardId: number | undefined;

      // Find issue IDs
      try {
        inwardId = await new Promise<number | undefined>((resolve, reject) => {
          db.get(
            'SELECT id FROM Issues WHERE title = ?', // Assuming 'title' stores the issue key
            [inwardIssueKey],
            (err, row: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(row?.id);
              }
            }
          );
        });

        outwardId = await new Promise<number | undefined>((resolve, reject) => {
          db.get(
            'SELECT id FROM Issues WHERE title = ?', // Assuming 'title' stores the issue key
            [outwardIssueKey],
            (err, row: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(row?.id);
              }
            }
          );
        });
      } catch (dbError: any) {
        console.error('Database error fetching issue IDs:', dbError);
        return res.status(500).json({ error: 'Database error fetching issue IDs' });
      }

      if (!inwardId || !outwardId) {
        return res.status(404).json({ error: 'One or both issues not found' });
      }

      // Check if link already exists
      try {
        const existingLink: any = await new Promise((resolve, reject) => {
          db.get(
            'SELECT id FROM IssueLinks WHERE source_issue_id = ? AND target_issue_id = ?',
            [inwardId, outwardId],
            (err, row: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });

        if (existingLink) {
          return res.status(400).json({ error: 'Issue link already exists' });
        }
      } catch (dbError: any) {
        console.error('Database error checking existing link:', dbError);
        return res.status(500).json({ error: 'Database error checking existing link' });
      }

      // Insert the new link
      try {
        await db.run(
          'INSERT INTO IssueLinks (source_issue_id, target_issue_id, link_type) VALUES (?, ?, ?)',
          [inwardId, outwardId, 'Relates']
        );
      } catch (dbError: any) {
        console.error('Database error creating issue link:', dbError);
        return res.status(500).json({ error: 'Database error creating issue link' });
      }

      // Update updated_at timestamps
      try {
        await db.run(
          'UPDATE Issues SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [inwardId]
        );
        await db.run(
          'UPDATE Issues SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [outwardId]
        );
      } catch (dbError: any) {
        console.error('Database error updating issue timestamps:', dbError);
        return res.status(500).json({ error: 'Database error updating issue timestamps' });
      }

      res.status(201).send();
    } catch (error: any) {
      console.error('Error linking issues:', error);
      next(error);
    }
  },
};
