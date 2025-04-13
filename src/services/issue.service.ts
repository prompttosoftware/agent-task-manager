// src/services/issue.service.ts

import { Issue } from '../types/issue';
import { Pool } from 'pg'; // Import the PostgreSQL client

export class IssueService {
  private db: Pool; // PostgreSQL connection pool

  constructor() {
    // Initialize the database connection here
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL, // Use environment variable for database URL
    });
  }

  async searchIssues(query: string): Promise<Issue[]> {
    try {
      const searchTerm = query.toLowerCase();
      const result = await this.db.query<Issue>(
        'SELECT * FROM issues WHERE LOWER(summary) LIKE $1 OR LOWER(description) LIKE $1', // Assuming you have 'summary' and 'description' columns
        [`%${searchTerm}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('Error searching issues:', error);
      throw new Error('Failed to search issues.');
    }
  }

  async getIssue(issueKey: string): Promise<Issue | undefined> {
    try {
      const result = await this.db.query<Issue>('SELECT * FROM issues WHERE issue_key = $1', [issueKey]);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error('Error getting issue:', error);
      throw new Error('Failed to get issue.');
    }
  }

  async getIssuesByBoard(boardId: string): Promise<Issue[]> {
    try {
      const result = await this.db.query<Issue>('SELECT * FROM issues WHERE board_id = $1', [boardId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting issues by board:', error);
      throw new Error('Failed to get issues by board.');
    }
  }

  async addIssue(issue: Issue): Promise<Issue> {
    try {
      const result = await this.db.query<Issue>(
        'INSERT INTO issues (summary, description, issue_type, board_id, assignee) VALUES ($1, $2, $3, $4, $5) RETURNING *', // Adjust column names as needed
        [issue.summary, issue.description, issue.issueType, issue.boardId, issue.assignee]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding issue:', error);
      throw new Error('Failed to add issue.');
    }
  }

  async updateIssue(issueKey: string, updates: Partial<Issue>): Promise<Issue | undefined> {
    try {
      const updateValues = Object.entries(updates).filter(([, value]) => value !== undefined);
      if (updateValues.length === 0) {
        return this.getIssue(issueKey);
      }

      const setClause = updateValues.map(([key, _, index]) => `${key} = $${index + 1}`).join(', ');
      const params = updateValues.map(([, value]) => value);
      const result = await this.db.query<Issue>(
          `UPDATE issues SET ${setClause} WHERE issue_key = $${updateValues.length + 1} RETURNING *`, 
          [...params, issueKey]
      );

      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw new Error('Failed to update issue.');
    }
  }

  async deleteIssue(issueKey: string): Promise<boolean> {
    try {
      const result = await this.db.query('DELETE FROM issues WHERE issue_key = $1', [issueKey]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting issue:', error);
      throw new Error('Failed to delete issue.');
    }
  }

  async addAttachment(issueKey: string, filePath: string): Promise<string | undefined> {
    // In a real implementation, you would use file handling middleware (e.g., multer)
    // to save the file and associate it with the issue.
    // For now, return the file path.
    try {
        // Assuming you have an attachments table with columns issue_key and file_path
        await this.db.query('INSERT INTO attachments (issue_key, file_path) VALUES ($1, $2)', [issueKey, filePath]);
        return filePath;
    } catch (error) {
        console.error('Error adding attachment:', error);
        throw new Error('Failed to add attachment.');
    }
  }

  async linkIssue(fromIssueKey: string, toIssueKey: string, type: string): Promise<boolean> {
    try {
      // Assuming you have an issue_links table with columns from_issue_key, to_issue_key, and link_type
      await this.db.query('INSERT INTO issue_links (from_issue_key, to_issue_key, link_type) VALUES ($1, $2, $3)', [fromIssueKey, toIssueKey, type]);
      return true;
    } catch (error) {
      console.error('Error linking issue:', error);
      throw new Error('Failed to link issue.');
    }
  }

  async assignIssue(issueKey: string, assigneeKey: string): Promise<Issue | undefined> {
      try {
        const result = await this.db.query<Issue>(
            'UPDATE issues SET assignee = $1 WHERE issue_key = $2 RETURNING *', 
            [assigneeKey, issueKey]
        );
        return result.rows.length > 0 ? result.rows[0] : undefined;
      } catch (error) {
        console.error('Error assigning issue:', error);
        throw new Error('Failed to assign issue.');
      }
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<Issue | undefined> {
    try {
      const result = await this.db.query<Issue>(
        'UPDATE issues SET status = $1 WHERE issue_key = $2 RETURNING *', // Assuming you have a 'status' column
        [transitionId, issueKey]
      );
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error('Error transitioning issue:', error);
      throw new Error('Failed to transition issue.');
    }
  }

  async getCreateMeta(): Promise<any> {
    try {
      // Fetch create metadata from the database
      const result = await this.db.query(
          'SELECT p.id as project_id, p.key as project_key, p.name as project_name, it.id as issuetype_id, it.name as issuetype_name FROM projects p JOIN issue_types it ON p.id = it.project_id;'
      );

      const projects = result.rows.reduce((acc: any[], row: any) => {
          const existingProject = acc.find(p => p.id === row.project_id);
          if (existingProject) {
              existingProject.issuetypes.push({ id: row.issuetype_id, name: row.issuetype_name });
          } else {
              acc.push({
                  id: row.project_id,
                  key: row.project_key,
                  name: row.project_name,
                  issuetypes: [{ id: row.issuetype_id, name: row.issuetype_name }]
              });
          }
          return acc;
      }, []);

      return {
          projects: projects.map((project: any) => ({
              id: project.id.toString(),
              key: project.key,
              name: project.name,
              issuetypes: project.issuetypes.map((issuetype: any) => ({
                  id: issuetype.id.toString(),
                  name: issuetype.name
              }))
          }))
      };
    } catch (error) {
      console.error('Error getting create meta:', error);
      throw new Error('Failed to get create meta.');
    }
  }

  async getTransitions(issueKey: string): Promise<any> {
    try {
      // Fetch available transitions for the given issue from the database
      const result = await this.db.query('SELECT * FROM transitions WHERE issue_key = $1', [issueKey]);
      return {
        transitions: result.rows,
      };
    } catch (error) {
      console.error('Error getting transitions:', error);
      throw new Error('Failed to get transitions.');
    }
  }
}
