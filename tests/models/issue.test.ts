// tests/models/issue.test.ts
import { Issue } from '../src/models/issue';

describe('Issue Model', () => {
  it('should have the correct properties', () => {
    const issue: Issue = {
      id: 1,
      title: 'Test Issue',
      description: 'This is a test issue',
      status: 'open',
      assignee: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(issue.id).toBe(1);
    expect(issue.title).toBe('Test Issue');
    expect(issue.description).toBe('This is a test issue');
    expect(issue.status).toBe('open');
    expect(issue.assignee).toBe('user1');
    expect(issue.createdAt).toBeInstanceOf(Date);
    expect(issue.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow missing assignee', () => {
    const issue: Issue = {
      id: 2,
      title: 'Another Test Issue',
      description: 'This is another test issue',
      status: 'in progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(issue.assignee).toBeUndefined();
  });
});