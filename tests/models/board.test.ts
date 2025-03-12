// tests/models/board.test.ts
import { Board } from '../../src/models/board';

describe('Board Model', () => {
  it('should create a board with the correct properties', () => {
    const board = new Board('BOARD-1', 'Test Board');
    expect(board.id).toBe('BOARD-1');
    expect(board.name).toBe('Test Board');
  });
});