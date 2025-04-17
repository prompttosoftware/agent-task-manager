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
            'SELECT id FROM Issues WHERE key = ?', // Use 'key' instead of 'title'
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
            'SELECT id FROM Issues WHERE key = ?', // Use 'key' instead of 'title'
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

  async createIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { fields } = req.body;
      const issueType = fields?.issuetype?.name;
      const title = fields?.summary; // Use summary for title
      const key = fields?.key;

      if (!title || !issueType) {
        return res.status(400).json({ error: 'Title and Issue Type are required' });
      }

      let epicName: string | null = null;
      let epicId: number | null = null;
      let parentId: number | null = null;

      if (issueType === 'Subtask') {
        if (!fields?.parent?.key) {
          return res.status(400).json({ error: 'Parent key is required for Subtasks' });
        }

        try {
          parentId = await new Promise<number | null>((resolve, reject) => {
            db.get(
              'SELECT id FROM Issues WHERE key = ?', // Use key instead of id
              [fields.parent.key],
              (err, row: any) => {
                if (err) {
                  reject(err);
                } else {
                  if (!row) {
                    resolve(null); // Parent issue not found
                  } else {
                    resolve(row.id);
                  }
                }
              }
            );
          });
        } catch (dbError: any) {
          console.error('Database error fetching parent issue:', dbError);
          return res.status(500).json({ error: 'Database error fetching parent issue' });
        }

        if (parentId === null) {
          return res.status(400).json({ error: 'Parent issue not found' });
        }
      }

      if (issueType === 'Epic') {
        epicName = fields.customfield_10011 || null; // Extract Epic Name
      } else {
        // Handle Epic Link for non-Epic issues
        if (fields.customfield_10010) {
          const epicKey = fields.customfield_10010;

          try {
            const epic: any = await new Promise((resolve, reject) => {
              db.get(
                'SELECT id FROM Issues WHERE key = ? AND type = ?',
                [epicKey, 'Epic'],
                (err, row: any) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(row);
                  }
                }
              );
            });

            if (!epic) {
              return res.status(400).json({ error: 'Epic not found or not an Epic type' });
            }

            epicId = epic.id;
          } catch (dbError: any) {
            console.error('Database error fetching Epic:', dbError);
            return res.status(500).json({ error: 'Database error fetching Epic' });
          }
        }
      }

      // Insert the new issue
      try {
        const newIssue: any = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO Issues (title, type, epic_name, epic_id, parent_id, key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [title, issueType, epicName, epicId, parentId, key ], // include the key
            function (err) {
              if (err) {
                reject(err);
              } else {
                resolve({ id: this.lastID });
              }
            }
          );
        });

        res.status(201).json({ id: newIssue.id });
      } catch (dbError: any) {
        console.error('Database error creating issue:', dbError);
        return res.status(500).json({ error: 'Database error creating issue' });
      }
    } catch (error: any) {
      console.error('Error creating issue:', error);
      next(error);
    }
  },
};
