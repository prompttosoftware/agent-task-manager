// src/services/issue.service.ts

import { Issue, IssuePriority, IssueStatus, User, Comment } from '../types/issue';
import Database from 'better-sqlite3';
import db from '../db/database';

export class IssueService {
  private db: Database;

  constructor(db: Database = db) {
    this.db = db;
    this.initializeTable();
  }

  private initializeTable() {
    try {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS issues (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                reporterId TEXT NOT NULL,
                assigneeId TEXT,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                labels TEXT,
                dueDate TEXT
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                issueId TEXT NOT NULL,
                authorId TEXT NOT NULL,
                content TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (issueId) REFERENCES issues(id) ON DELETE CASCADE,
                FOREIGN KEY (authorId) REFERENCES users(id)
            )
        `);
    } catch (error) {
        console.error("Error initializing tables:", error);
        throw error; // Re-throw to indicate critical failure
    }
  }


  async createIssue(issue: Issue): Promise<Issue> {
    try {
      // Start a transaction to ensure atomicity
      this.db.exec('BEGIN');

      // Insert reporter if it doesn't exist
      this.insertOrUpdateUser(issue.reporter);

      // Insert assignee if it exists and doesn't exist
      if (issue.assignee) {
          this.insertOrUpdateUser(issue.assignee);
      }


      const stmt = this.db.prepare(`
          INSERT INTO issues (id, title, description, reporterId, assigneeId, priority, status, createdAt, updatedAt, labels, dueDate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const labelsString = issue.labels ? JSON.stringify(issue.labels) : null;
      const now = new Date().toISOString();

      stmt.run(
        issue.id,
        issue.title,
        issue.description,
        issue.reporter.id,
        issue.assignee?.id,
        issue.priority,
        issue.status,
        issue.createdAt,
        issue.updatedAt,
        labelsString,
        issue.dueDate,
      );

       // Insert comments
       if (issue.comments && issue.comments.length > 0) {
        issue.comments.forEach(comment => {
          this.insertComment(issue.id, comment);
        });
      }

      this.db.exec('COMMIT');

      return this.getIssueById(issue.id) as Promise<Issue>; // Return the full issue
    } catch (error: any) {
        this.db.exec('ROLLBACK');
        console.error('Error creating issue:', error);
        throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  async getAllIssues(): Promise<Issue[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM issues
      `);
      const issues = stmt.all() as any[]; // Use 'any' to bypass type checking
      return Promise.all(issues.map(async (issue) => {
          return await this.mapIssueFromDb(issue);
      }));
    } catch (error: any) {
      console.error('Error getting all issues:', error);
      throw new Error(`Failed to get all issues: ${error.message}`);
    }
  }


  async getIssueById(id: string): Promise<Issue | undefined> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM issues WHERE id = ?
      `);
      const issue = stmt.get(id) as any; // Use 'any' to bypass type checking
      if (!issue) {
          return undefined;
      }
      return await this.mapIssueFromDb(issue);
    } catch (error: any) {
      console.error('Error getting issue by ID:', error);
      throw new Error(`Failed to get issue by ID: ${error.message}`);
    } 
  }


  async updateIssue(issue: Issue): Promise<Issue | undefined> {
    try {
        this.db.exec('BEGIN');

        // Update reporter if it doesn't exist or has changed
        this.insertOrUpdateUser(issue.reporter);

        // Update assignee if it exists or has changed
        if (issue.assignee) {
            this.insertOrUpdateUser(issue.assignee);
        }


        const stmt = this.db.prepare(`
            UPDATE issues
            SET title = ?, description = ?, reporterId = ?, assigneeId = ?, priority = ?, status = ?, updatedAt = ?, labels = ?, dueDate = ?
            WHERE id = ?
        `);

        const labelsString = issue.labels ? JSON.stringify(issue.labels) : null;
        const now = new Date().toISOString();


        stmt.run(
            issue.title,
            issue.description,
            issue.reporter.id,
            issue.assignee?.id,
            issue.priority,
            issue.status,
            now,
            labelsString,
            issue.dueDate,
            issue.id
        );

        // Update/Insert comments.  First, delete existing comments and then insert the new set
        this.deleteCommentsForIssue(issue.id);
        if (issue.comments && issue.comments.length > 0) {
          issue.comments.forEach(comment => {
            this.insertComment(issue.id, comment);
          });
        }

        this.db.exec('COMMIT');
        return this.getIssueById(issue.id);


    } catch (error: any) {
      this.db.exec('ROLLBACK');
      console.error('Error updating issue:', error);
      throw new Error(`Failed to update issue: ${error.message}`);
    }
  }

  async deleteIssue(id: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM issues WHERE id = ?
      `);
      stmt.run(id);
    } catch (error: any) {
      console.error('Error deleting issue:', error);
      throw new Error(`Failed to delete issue: ${error.message}`);
    }
  }

  private async mapIssueFromDb(issue: any): Promise<Issue> {
    const reporter = await this.getUserById(issue.reporterId);
    const assignee = issue.assigneeId ? await this.getUserById(issue.assigneeId) : undefined;
    const comments = await this.getCommentsByIssueId(issue.id);

    return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        reporter: reporter!, // Assuming reporter always exists
        assignee: assignee,
        priority: issue.priority as IssuePriority,
        status: issue.status as IssueStatus,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        labels: issue.labels ? JSON.parse(issue.labels) : undefined,
        dueDate: issue.dueDate,
        comments: comments,
    };
  }

  private insertOrUpdateUser(user: User): void {
    try {
        const userStmt = this.db.prepare(`
            INSERT OR REPLACE INTO users (id, name, email)
            VALUES (?, ?, ?)
        `);
        userStmt.run(user.id, user.name, user.email);
    } catch (error: any) {
        console.error('Error inserting/updating user:', error);
        throw new Error(`Failed to insert/update user: ${error.message}`);
    }
  }

  private async getUserById(id: string): Promise<User | undefined> {
      try {
          const stmt = this.db.prepare(`
              SELECT * FROM users WHERE id = ?
          `);
          const user = stmt.get(id) as any;
          return user ? {
              id: user.id,
              name: user.name,
              email: user.email
          } : undefined;
      } catch (error: any) {
          console.error('Error getting user by ID:', error);
          throw new Error(`Failed to get user by ID: ${error.message}`);
      } 
  }

  private insertComment(issueId: string, comment: Comment): void {
    try {
      // Ensure the author exists
      this.insertOrUpdateUser(comment.author);

      const stmt = this.db.prepare(`
        INSERT INTO comments (id, issueId, authorId, content, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(comment.id, issueId, comment.author.id, comment.content, comment.createdAt);
    } catch (error: any) {
      console.error('Error inserting comment:', error);
      throw new Error(`Failed to insert comment: ${error.message}`);
    }
  }

  private async getCommentsByIssueId(issueId: string): Promise<Comment[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT c.*, u.name AS authorName, u.email AS authorEmail
        FROM comments c
        JOIN users u ON c.authorId = u.id
        WHERE c.issueId = ?
      `);
      const comments = stmt.all(issueId) as any[];
      return comments.map(comment => ({
          id: comment.id,
          author: { id: comment.authorId, name: comment.authorName, email: comment.authorEmail },
          content: comment.content,
          createdAt: comment.createdAt,
      }));
    } catch (error: any) {
      console.error('Error getting comments by issue ID:', error);
      throw new Error(`Failed to get comments by issue ID: ${error.message}`);
    }
  }

  private deleteCommentsForIssue(issueId: string): void {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM comments WHERE issueId = ?
      `);
      stmt.run(issueId);
    } catch (error: any) {
      console.error('Error deleting comments for issue:', error);
      throw new Error(`Failed to delete comments for issue: ${error.message}`);
    }
  }

}
