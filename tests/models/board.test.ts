// tests/models/board.test.ts
import { Board } from '../../src/models/board';
import { Issue } from '../../src/models/issue';

test('Board interface should have required properties', () => {
  const issue: Issue = {
    id: '123',
    summary: 'Test Issue',
    description: 'This is a test issue',
    status: 'Open',
  };

  const board: Board = {
    id: 'board-1',
    name: 'Test Board',
    issues: [issue],
  };

  expect(board.id).toBe('board-1');
  expect(board.name).toBe('Test Board');
  expect(board.issues[0].id).toBe('123');
});
