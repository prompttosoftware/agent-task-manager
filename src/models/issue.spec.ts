import { Issue } from './issue';

describe('Issue Model', () => {
  it('should define the Issue interface correctly', () => {
    const issue: Issue = {
      _id: 'testId',
      issuetype: 'Bug',
      summary: 'Test Summary',
      description: 'Test Description',
      key: 'TEST-1'
    };

    expect(issue).toHaveProperty('_id');
    expect(issue).toHaveProperty('issuetype');
    expect(issue).toHaveProperty('summary');
    expect(issue).toHaveProperty('description');
    expect(issue).toHaveProperty('key');
  });

  it('should create an Issue object with all properties', () => {
    const issue: Issue = {
      _id: '123',
      issuetype: 'Bug',
      summary: 'Test Issue',
      description: 'This is a test issue.',
      parentKey: 'PARENT-1',
      key: 'TEST-1',
    };

    expect(issue._id).toBe('123');
    expect(issue.issuetype).toBe('Bug');
    expect(issue.summary).toBe('Test Issue');
    expect(issue.description).toBe('This is a test issue.');
    expect(issue.parentKey).toBe('PARENT-1');
    expect(issue.key).toBe('TEST-1');
  });

  it('should create an Issue object with optional properties (parentKey)', () => {
    const issue: Issue = {
      _id: '456',
      issuetype: 'Task',
      summary: 'Another Test Issue',
      description: 'This is another test issue.',
      key: 'TEST-2',
    };

    expect(issue._id).toBe('456');
    expect(issue.issuetype).toBe('Task');
    expect(issue.summary).toBe('Another Test Issue');
    expect(issue.description).toBe('This is another test issue.');
    expect(issue.parentKey).toBeUndefined();
    expect(issue.key).toBe('TEST-2');
  });
});