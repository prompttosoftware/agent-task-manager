// tests/models/issue.test.ts
import { Issue } from '../../src/models/issue';

test('Issue interface should have required properties', () => {
  const issue: Issue = {
    id: '123',
    summary: 'Test Issue',
    description: 'This is a test issue',
    status: 'Open',
  };

  expect(issue.id).toBe('123');
  expect(issue.summary).toBe('Test Issue');
  expect(issue.description).toBe('This is a test issue');
  expect(issue.status).toBe('Open');
});
