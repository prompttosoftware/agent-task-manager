// tests/models/board.test.ts

import { Board } from '../../src/models/board';

describe('Board Model', () => {
  it('should create a Board instance', () => {
    const board = new Board('board-id', 'board-name');
    expect(board.id).toBe('board-id');
    expect(board.name).toBe('board-name');
  });

  it('should have default properties', () => {
    const board = new Board('board-id', 'board-name');
    expect(board.issues).toEqual([]);
  });
});