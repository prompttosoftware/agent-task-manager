import { AnyIssue, IssueType } from '../models/issue';

export class Database {
  private db: { issues: AnyIssue[]; issueKeyCounter: { [key in IssueType]?: number } };
  public ready: Promise<void>;

  constructor() {
    console.log('Database constructor called'); // Log when the constructor is called.
    this.db = {
      issues: [],
      issueKeyCounter: {
        TASK: 0,
        STOR: 0,
        EPIC: 0,
        BUG: 0,
        SUBT: 0,
      },
    };
    this.ready = Promise.resolve(); // Simulate database initialization
    console.log('Database initialized', this.db); // Log the initialized database
  }

  getIssueKeyCounter(): number {
    console.log('getIssueKeyCounter called'); // Log when the method is called.
    return this.db.issueKeyCounter.TASK || 0;
  }

  addIssue(issue: AnyIssue): void {
    console.log('addIssue called with:', issue); // Log when the method is called.
    this.db.issues.push(issue);
    console.log('Issue added, current issues:', this.db.issues);
  }

  incrementIssueKeyCounter(): void {
    console.log('incrementIssueKeyCounter called'); // Log when the method is called.
    this.db.issueKeyCounter.TASK = (this.db.issueKeyCounter.TASK || 0) + 1;
    console.log('Issue key counter incremented to:', this.db.issueKeyCounter.TASK);
  }

  async getNextIssueId(issueType: IssueType): Promise<number> {
    console.log(`getNextIssueId called for ${issueType}`);
    const currentCounter = this.db.issueKeyCounter[issueType] || 0;
    this.db.issueKeyCounter[issueType] = currentCounter + 1;
    return currentCounter + 1;
  }


  // For testing and potential future use
  getIssues(): AnyIssue[] {
    console.log('getIssues called');
    return this.db.issues;
  }
}
