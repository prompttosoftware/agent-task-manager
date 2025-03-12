// tests/models/board.test.ts
import { Board, Label } from '../src/models/board';

describe('Board Model', () => {
  it('should define the Board interface', () => {
    const board: Board = {
      id: '1',
      name: 'Test Board',
      labels: [],
    };
    expect(board).toBeDefined();
    expect(board.id).toBe('1');
    expect(board.name).toBe('Test Board');
  });

  it('should define the Label interface within Board', () => {
    const label: Label = {
      id: '1',
      name: 'Test Label',
      color: '#FFFFFF',
    };
    const board: Board = {
      id: '1',
      name: 'Test Board',
      labels: [label],
    };
    expect(board.labels[0]).toBe(label);
    expect(board.labels[0].id).toBe('1');
    expect(board.labels[0].name).toBe('Test Label');
    expect(board.labels[0].color).toBe('#FFFFFF');
  });
});