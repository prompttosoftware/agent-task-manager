// src/services/issueService.ts
import { v4 as uuidv4 } from 'uuid';
import { Task, DbSchema } from '../models/index';

/**
 * IssueService handles business logic related to issues.
 * It uses an in-memory store.
 */
class IssueService {
  private issues: DbSchema;
  private issueKeyCounter: number;

  constructor() {
    this.issues = { issues: [], issueKeyCounter: 1000 };
    this.issueKeyCounter = 1000; // Initialize ID counter
  }

  /**
   * Creates a new issue and stores it in the in-memory store.
   * @param input - The data for the new issue, containing a summary and an optional description.
   * @returns A Promise that resolves to the newly created Issue object, including its generated ID and default status.
   */
  public async createIssue(input: { summary: string; description?: string }): Promise<Task> {
    const key = `ATM-${this.issueKeyCounter}`;
    this.issueKeyCounter++;
    const newIssue: Task = {
      id: uuidv4(),
      key,
      issueType: "Task",
      summary: input.summary,
      description: input.description,
      status: "Todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.issues.issues.push(newIssue);

    // Return a copy of the created issue to prevent unintended mutations of the stored object.
    return { ...newIssue };
  }

  // Placeholder for other issue-related methods:
  // public async getIssueById(id: string): Promise<Issue | undefined> { /* ... */ }
  // public async getAllIssues(): Promise<Issue[]> { /* ... */ }
  // public async updateIssue(id: string, updates: Partial<Omit<Issue, 'id'>>): Promise<Issue | undefined> { /* ... */ }
  // public async deleteIssue(id: string): Promise<boolean> { /* ... */ }
}

// Export a singleton instance of the IssueService.
// This allows other parts of the application to use the same instance.
export const issueService = new IssueService();

// Test cases
if (process.env.NODE_ENV === 'test') {
  describe('IssueService', () => {
    it('should create an issue with the correct properties', async () => {
      const issueService = new IssueService();
      const summary = 'Test summary';
      const description = 'Test description';
      const createdIssue = await issueService.createIssue({ summary, description });

      expect(createdIssue.summary).toBe(summary);
      expect(createdIssue.description).toBe(description);
      expect(createdIssue.issueType).toBe('Task');
      expect(createdIssue.status).toBe('Todo');
      expect(createdIssue.key).toMatch(/^ATM-\d+$/);
      expect(parseInt(createdIssue.key.split('-')[1], 10)).toBe(1001);
      expect(issueService.issues.issues).toContain(createdIssue);
    });
  });
}
