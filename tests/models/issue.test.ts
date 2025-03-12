// tests/models/issue.test.ts
import { Issue } from '../../src/models/issue';

describe('Issue Model', () => {
  it('should create an issue with the correct properties', () => {
    const issue = new Issue('ISSUE-1', 'Test Issue', 'This is a test issue');
    expect(issue.id).toBe('ISSUE-1');
    expect(issue.summary).toBe('Test Issue');
    expect(issue.description).toBe('This is a test issue');
  });
});