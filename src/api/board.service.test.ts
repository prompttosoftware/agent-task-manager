import { describe, it, expect, beforeEach } from 'vitest';
import { BoardService } from './board.service';
import { Board } from './types/board'; // Corrected import
import { db } from '../../src/db/database'; // Corrected import, Assuming database setup exists

// Mock the database module (if not already mocked in board.service.ts)
jest.mock('../../src/db/database');

describe('BoardService', () => {
  let boardService: BoardService;

  beforeEach(() => {
    boardService = new BoardService();
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  it('should create a board', async () => {
    const newBoard: Board = {
      name: 'Test Board',
      description: 'Test Description',
    };

    const mockDBRun = jest.fn().mockReturnValue({ lastID: 1 });
    (db.prepare as jest.Mock).mockReturnValue({ run: mockDBRun }); // Mock the prepare and run methods

    const createdBoard = await boardService.createBoard(newBoard);

    expect(mockDBRun).toHaveBeenCalledWith(newBoard.name, newBoard.description);
    expect(createdBoard).toEqual(expect.objectContaining({ ...newBoard, id: 1 }));
  });

    it('should handle errors during board creation', async () => {
        const newBoard: Board = {
            name: 'Test Board',
            description: 'Test Description',
        };

        const mockDBRun = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });
        (db.prepare as jest.Mock).mockReturnValue({ run: mockDBRun });

        await expect(boardService.createBoard(newBoard)).rejects.toThrowError('Database error');
    });
});