import { describe, it, expect, beforeEach } from 'vitest';
import { BoardService } from './services/board.service';
import { Board } from './types/board';
import { db } from '../../src/db/database';

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

    it('should get all boards', async () => {
      const mockBoards: Board[] = [
        { id: 1, name: 'Board 1', description: 'Desc 1' },
        { id: 2, name: 'Board 2', description: 'Desc 2' },
      ];

      const mockDBQuery = jest.fn().mockResolvedValue({ rows: mockBoards });
      (db.query as jest.Mock).mockReturnValue(mockDBQuery);

      const boards = await boardService.getBoards();
      expect(boards).toEqual(mockBoards);
      expect(mockDBQuery).toHaveBeenCalledWith('SELECT * FROM boards');
    });

    it('should get board by id', async () => {
      const mockBoard: Board = { id: 1, name: 'Board 1', description: 'Desc 1' };
      const mockDBQuery = jest.fn().mockResolvedValue({ rows: [mockBoard] });
      (db.query as jest.Mock).mockReturnValue(mockDBQuery);

      const board = await boardService.getBoardById(1);
      expect(board).toEqual(mockBoard);
      expect(mockDBQuery).toHaveBeenCalledWith('SELECT * FROM boards WHERE id = $1', [1]);
    });
});
