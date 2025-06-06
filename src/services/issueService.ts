import { AnyIssue, IssueType, CreateIssueInput } from '../models/issue';
import { Database } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service class for handling issue-related operations.
 */
export class IssueService {
  private db: Database;

  /**
   * Creates an instance of IssueService.
   * @param db - The database instance to use for operations.
   */
  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Creates a new issue.
   *
   * @param issue - The issue object (CreateIssueInput type) to create.
   * @returns The created issue object or an array of validation errors.
   */
  async createIssue(issue: CreateIssueInput): Promise<AnyIssue | string[]> {
    const errors: string[] = [];

    // Validation
    if (!issue.summary) {
      errors.push('Summary is required');
    }
    if (!issue.issueType) {
      errors.push('Issue type is required');
    }
    if (issue.issueType === 'SUBT' && !issue.parentIssueKey) {
      errors.push('Parent issue key is required for subtasks');
    }

    if (errors.length > 0) {
      return errors;
    }

    const now = new Date();
    const id = uuidv4();
    const issueType = issue.issueType;
    const issueKeyPrefix = this.getIssueKeyPrefix(issueType);
    const nextIssueId = await this.db.getNextIssueId(issueType);
    const issueKey = `${issueKeyPrefix}-${nextIssueId}`;

    let newIssue: AnyIssue;

    switch (issueType) {
      case 'TASK':
        newIssue = {
          id,
          key: issueKey,
          issueType: 'TASK',
          summary: issue.summary,
          description: issue.description,
          status: issue.status,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        break;
      case 'STOR':
        newIssue = {
          id,
          key: issueKey,
          issueType: 'STOR',
          summary: issue.summary,
          description: issue.description,
          status: issue.status,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        break;
      case 'EPIC':
        newIssue = {
          id,
          key: issueKey,
          issueType: 'EPIC',
          summary: issue.summary,
          description: issue.description,
          status: issue.status,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        break;
      case 'BUG':
        newIssue = {
          id,
          key: issueKey,
          issueType: 'BUG',
          summary: issue.summary,
          description: issue.description,
          status: issue.status,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        break;
      case 'SUBT':
        newIssue = {
          id,
          key: issueKey,
          issueType: 'SUBT',
          summary: issue.summary,
          description: issue.description,
          status: issue.status,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          parentIssueKey: (issue as any).parentIssueKey, // Type assertion is safe since validation checks this
        };
        break;
      default:
        // This should never happen due to the validation, but handle it for safety
        errors.push('Invalid issue type');
        return errors;
    }

    this.db.addIssue(newIssue);
    return newIssue;
  }

  private getIssueKeyPrefix(issueType: IssueType): string {
    switch (issueType) {
      case 'TASK':
        return 'TASK';
      case 'STOR':
        return 'STOR';
      case 'EPIC':
        return 'EPIC';
      case 'BUG':
        return 'BUG';
      case 'SUBT':
        return 'SUBT';
      default:
        return 'MISC'; // Or handle this case as needed. Should not happen due to validation.
    }
  }
}
