import { BoardService } from './board.service';
import { db } from '../../src/db/database';
import { Board } from '../types/board';

// Mock the database module
jest.mock('../../src/db/database');

describe('BoardService', () => {
  let boardService: BoardService;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    boardService = new BoardService();
  });

  describe('createBoard', () => {
    it('should create a board and return the created board', async () => {
      const mockBoard: Board = { name: 'Test Board', description: 'Test Description' } as Board;
      const mockResult = { rows: [{ id: 1, ...mockBoard }] };
      (db.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await boardService.createBoard(mockBoard);

      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO boards (name, description) VALUES ($1, $2) RETURNING *',
        [mockBoard.name, mockBoard.description]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    it('should throw an error if board creation fails', async () => {
      const mockBoard: Board = { name: 'Test Board', description: 'Test Description' } as Board;
      const errorMessage = 'Database error';
      (db.query as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(boardService.createBoard(mockBoard)).rejects.toThrow('Failed to create board in database');
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO boards (name, description) VALUES ($1, $2) RETURNING *',
        [mockBoard.name, mockBoard.description]
      );
    });
  });

  describe('getBoards', () => {
    it('should return an array of boards', async () => {
      const mockBoards: Board[] = [
        { id: 1, name: 'Board 1', description: 'Desc 1' },
        { id: 2, name: 'Board 2', description: 'Desc 2' },
      ];
      const mockResult = { rows: mockBoards };
      (db.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await boardService.getBoards();

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM boards');
      expect(result).toEqual(mockBoards);
    });

    it('should throw an error if getting boards fails', async () => {
      const errorMessage = 'Database error';
      (db.query as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(boardService.getBoards()).rejects.toThrow('Failed to get boards from database');
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM boards');
    });
  });

  describe('getBoardById', () => {
    it('should return a board if found', async () => {
      const mockBoard: Board = { id: 1, name: 'Test Board', description: 'Test Description' } as Board;
      const mockResult = { rows: [mockBoard] };
      (db.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await boardService.getBoardById(1);

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM boards WHERE id = $1', [1]);
      expect(result).toEqual(mockBoard);
    });

    it('should return undefined if board is not found', async () => {
      const mockResult = { rows: [] };
      (db.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await boardService.getBoardById(1);

      expect(db.query).toHaveBeenCalledWith('SELECT * FROM boards WHERE id = $1', [1]);
      expect(result).toBeUndefined();
    });

    it('should throw an error if getting board by ID fails', async () => {
      const errorMessage = 'Database error';
      (db.query as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(boardService.getBoardById(1)).rejects.toThrow('Failed to get board from database');
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM boards WHERE id = $1', [1]);
    });
  });
});
