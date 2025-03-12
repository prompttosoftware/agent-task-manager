// tests/models/issue.test.ts

import { Issue } from '../../src/models/issue';

describe('Issue Model', () => {
  it('should create an Issue instance', () => {
    const issue = new Issue('issue-id', 'issue-summary', 'issue-description');
    expect(issue.id).toBe('issue-id');
    expect(issue.summary).toBe('issue-summary');
    expect(issue.description).toBe('issue-description');
  });

  it('should have default properties', () => {
    const issue = new Issue('issue-id', 'issue-summary', 'issue-description');
    expect(issue.status).toBeUndefined();
    expect(issue.assignee).toBeUndefined();
    expect(issue.attachments).toEqual([]);
  });
});