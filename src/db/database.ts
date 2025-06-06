import { AnyIssue } from '../models/issue';

export class Database {
  private db: { issues: AnyIssue[]; issueKeyCounter: number };
  public ready: Promise<void>;

  constructor() {
    console.log('Database constructor called'); // Log when the constructor is called.
    this.db = {
      issues: [],
      issueKeyCounter: 0,
    };
    this.ready = Promise.resolve(); // Simulate database initialization
    console.log('Database initialized', this.db); // Log the initialized database
  }

  getIssueKeyCounter(): number {
    console.log('getIssueKeyCounter called'); // Log when the method is called.
    return this.db.issueKeyCounter;
  }

  addIssue(issue: AnyIssue): void {
    console.log('addIssue called with:', issue); // Log when the method is called.
    this.db.issues.push(issue);
    console.log('Issue added, current issues:', this.db.issues);
  }

  incrementIssueKeyCounter(): void {
    console.log('incrementIssueKeyCounter called'); // Log when the method is called.
    this.db.issueKeyCounter++;
    console.log('Issue key counter incremented to:', this.db.issueKeyCounter);
  }

  // For testing and potential future use
  getIssues(): AnyIssue[] {
    console.log('getIssues called');
    return this.db.issues;
  }
}
