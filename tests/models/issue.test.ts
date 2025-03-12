// tests/models/issue.test.ts

import { Issue } from '../../src/models/issue';

test('Issue interface should have the correct properties', () => {
  const issue: Issue = {
    id: 1,
    title: 'Test Issue',
    description: 'This is a test issue',
    status: 'Open',
    assignee: 'testUser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  expect(issue.id).toBe(1);
  expect(issue.title).toBe('Test Issue');
  expect(issue.description).toBe('This is a test issue');
  expect(issue.status).toBe('Open');
  expect(issue.assignee).toBe('testUser');
  expect(issue.createdAt).toBeInstanceOf(Date);
  expect(issue.updatedAt).toBeInstanceOf(Date);
});
