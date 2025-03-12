// tests/models/board.test.ts

import { Board } from '../../src/models/board';
import { Issue } from '../../src/models/issue';

test('Board interface should have the correct properties', () => {
  const issue: Issue = {
    id: 1,
    title: 'Test Issue',
    description: 'This is a test issue',
    status: 'Open',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const board: Board = {
    id: 1,
    name: 'Test Board',
    issues: [issue],
    columns: ['To Do', 'In Progress', 'Done'],
  };

  expect(board.id).toBe(1);
  expect(board.name).toBe('Test Board');
  expect(board.issues.length).toBe(1);
  expect(board.columns).toEqual(['To Do', 'In Progress', 'Done']);
});
