import { AnyIssue, IssueType, Subtask } from '../models/issue';
import { Database } from '../db/database';

export class IssueService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async createIssue(issue: AnyIssue): Promise<AnyIssue | string[]> {
    const errors: string[] = [];
    const allowedTypes: IssueType[] = ['TASK', 'STOR', 'EPIC', 'BUG', 'SUBT'];

    // Validate summary
    if (!issue.summary || issue.summary.trim() === '') {
      errors.push('Summary is required.');
    }

    // Validate issue type
    if (!issue.issueType || !allowedTypes.includes(issue.issueType)) {
      errors.push('Invalid or missing issue type. Allowed types are: TASK, STOR, EPIC, BUG, SUBT.');
    } else if (issue.issueType === 'SUBT') {
      // Validate parentIssueKey for subtasks
      const subtaskIssue = issue as Subtask; // Type assertion to access parentIssueKey
      if (!subtaskIssue.parentIssueKey || subtaskIssue.parentIssueKey.trim() === '') {
        errors.push('Parent issue key is required for subtasks.');
      }
    }

    // Return errors if any validation failed
    if (errors.length > 0) {
      return errors;
    }

    // Generate a unique key
    const issueType = issue.issueType; // issueType is guaranteed to be valid here
    const keyPrefix = issueType === 'SUBT' ? 'SUBT' : (issueType === 'TASK' ? 'TASK' : (issueType === 'STOR' ? 'STOR' : (issueType === 'EPIC' ? 'EPIC' : 'BUG')));
    const nextId = await this.db.getNextIssueId(issueType);
    const key = `${keyPrefix}-${nextId}`;

    // Set timestamps
    const now = new Date();
    const createdAt = now.toISOString();
    const updatedAt = now.toISOString();

    // Create the issue object with generated properties
    const newIssue: AnyIssue = {
      ...issue,
      id: crypto.randomUUID(),
      key,
      createdAt,
      updatedAt,
    };

    // Add the issue to the database
    await this.db.addIssue(newIssue);

    return newIssue; // Validation passed, return the created issue
  }
}
