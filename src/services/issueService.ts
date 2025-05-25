// src/services/issueService.ts

/**
 * Represents an issue in the system.
 */
export interface Issue {
  id: string;
  summary: string;
  description?: string;
  status: string;
}

/**
 * Input type for creating a new issue.
 * Summary is mandatory, description is optional.
 */
export interface CreateIssueInput {
  summary: string;
  description?: string;
}

const DEFAULT_ISSUE_STATUS = 'To Do';

/**
 * IssueService handles business logic related to issues.
 * It uses an in-memory store.
 */
class IssueService {
  private issues: Map<string, Issue>;
  private nextId: number;

  constructor() {
    this.issues = new Map<string, Issue>();
    this.nextId = 1; // Initialize ID counter
  }

  /**
   * Generates a new unique ID for an issue.
   * For this in-memory store, IDs are simple incrementing numbers converted to strings.
   * @returns A unique string ID.
   */
  private generateId(): string {
    const id = this.nextId.toString();
    this.nextId++;
    return id;
  }

  /**
   * Creates a new issue and stores it in the in-memory store.
   * @param input - The data for the new issue, containing a summary and an optional description.
   * @returns A Promise that resolves to the newly created Issue object, including its generated ID and default status.
   */
  public async createIssue(input: CreateIssueInput): Promise<Issue> {
    const id = this.generateId();

    const newIssue: Issue = {
      id,
      summary: input.summary,
      description: input.description, // Assigns undefined if input.description is undefined, which matches the Issue interface.
      status: DEFAULT_ISSUE_STATUS,
    };

    this.issues.set(id, newIssue);

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
