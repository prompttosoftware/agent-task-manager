import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db';
import { Issue } from '../../models/issue';
import { Status } from '../../models/status';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { Webhook } from '../../models/webhook';
import { URL } from 'url';

import { webhookService } from '../../services/webhookService';

const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

const validEvents = ['issue_created', 'issue_updated', 'issue_deleted'];

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

  async searchIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const jql = req.query.jql as string;

      if (!jql) {
        return res.status(400).json({ error: 'JQL query is required' });
      }

      // Parse JQL (very basic parsing for status)
      const statusMatch = jql.match(/status\s*=\s*([a-zA-Z0-9']+)/i);

      if (!statusMatch) {
        return res.status(400).json({ error: 'Invalid JQL format. Only status queries are supported.' });
      }

      let statusValue = statusMatch[1].replace(/'/g, ''); // Remove quotes

      let statusId: number | undefined;

      // Check if statusValue is a number (status ID) or a string (status name)
      if (!isNaN(Number(statusValue))) {
        statusId = Number(statusValue);
      } else {
        // Query Statuses table to find the corresponding id
        try {
          statusId = await new Promise<number | undefined>((resolve, reject) => {
            db.get(
              'SELECT id FROM Statuses WHERE name = ?',
              [statusValue],
              (err, row: any) => {
                if (err) {
                  reject(err);
                } else {
                  if (row) {
                    resolve(row.id);
                  } else {
                    resolve(undefined); // Status not found
                  }
                }
              }
            );
          });
        } catch (dbError: any) {
          console.error('Database error fetching status ID:', dbError);
          return res.status(500).json({ error: 'Database error fetching status ID' });
        }

        if (!statusId) {
          return res.status(400).json({ error: `Status '${statusValue}' not found` });
        }
      }

      // Query Issues table, filtering by status_id
      let issues: Issue[] = [];
      try {
        issues = await new Promise((resolve, reject) => {
          db.all<Issue[]>(
            `SELECT Issues.* FROM Issues INNER JOIN Statuses ON Issues.status_id = Statuses.id WHERE Issues.status_id = ?`,
            [statusId],
            (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows);
              }
            }
          );
        });
      } catch (dbError: any) {
        console.error('Database error fetching issues:', dbError);
        return res.status(500).json({ error: 'Database error fetching issues' });
      }

      // Format the response
      const formattedIssues = await Promise.all(issues.map(async (issue) => await formatIssueResponse(issue)));

      const response = {
        expand: 'schema,names',
        startAt: 0,
        maxResults: issues.length,
        total: issues.length,
        issues: formattedIssues,
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error searching issues:', error);
      next(error);
    }
  },

  async createWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, events } = req.body;

      // Validate request body
      if (!url || !events || !Array.isArray(events)) {
        return res.status(400).json({ error: 'URL and Events are required' });
      }

      if (!isValidURL(url)) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      const invalidEvents = events.filter((event) => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return res.status(400).json({ error: `Invalid events: ${invalidEvents.join(', ')}` });
      }

      // Store webhook details in the database
      const webhookData = {
        url: url,
        events: events.join(',') // Store events as comma-separated string
      };

      const webhook = await webhookService.createWebhook(webhookData);

      // Return a 201 Created response with the webhook details, including the generated ID.
      res.status(201).json({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events.split(',')
      });

    } catch (error: any) {
      console.error('Error creating webhook:', error);
      next(error);
    }
  },

  async getWebhooks(req: Request, res: Response, next: NextFunction) {
    try {
      // Fetch all webhooks from the database
      const webhooks: any[] = await new Promise((resolve, reject) => {
        db.all('SELECT id, url, events FROM Webhooks', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });

      // Format the webhooks for the response
      const formattedWebhooks = webhooks.map(webhook => ({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events.split(',')
      }));

      // Return the webhooks in a 200 OK response
      res.status(200).json(formattedWebhooks);
    } catch (error: any) {
      console.error('Error getting webhooks:', error);
      next(error);
    }
  },

  async deleteWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookId = req.params.webhookId;

      if (!webhookId) {
        return res.status(400).json({ error: 'Webhook ID is required' });
      }

      await webhookService.deleteWebhook(webhookId);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      next(error);
    }
  },
};