import { BoardService } from './board.service';
import { Board } from '../types/board';
import { mock } from 'vitest-mock-extended';
import {  describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/db/database';


vi.mock('../../src/db/database');

describe('BoardService', () => {
  let boardService: BoardService;

  beforeEach(() => {
    boardService = new BoardService();
    vi.clearAllMocks()
  });

  it('should get all boards', async () => {
    const mockBoards: Board[] = [
      { id: 1, name: 'Board 1', description: 'Description 1' },
      { id: 2, name: 'Board 2', description: 'Description 2' },
    ];

    (db.prepare as any).mockReturnValue({ all: vi.fn().mockResolvedValue(mockBoards) });

    const boards = await boardService.getAllBoards();

    expect(boards).toEqual(mockBoards);
    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM boards');
    expect((db.prepare as any).mock.calls[0][0]).toBe('SELECT * FROM boards');
  });

  it('should handle errors when fetching boards', async () => {
    const errorMessage = 'Failed to fetch boards from database';
    (db.prepare as any).mockReturnValue({ all: vi.fn().mockRejectedValue(new Error(errorMessage)) });

    await expect(boardService.getAllBoards()).rejects.toThrow(errorMessage);
    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM boards');
  });
});