import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from '../src/api/services/board.service';
import { Board } from '../src/api/models/board';
import { db } from '../src/db/database';

// Mock the database module
jest.mock('../src/db/database');

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoardService],
    }).compile();

    service = module.get<BoardService>(BoardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBoard', () => {
    it('should create a board and return it', async () => {
      const mockBoard: Partial<Board> = { name: 'Test Board', description: 'Test Description' };
      const mockResult = { lastInsertRowid: 1 };
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue(mockResult) });
      const expectedBoard: Board = { id: 1, name: 'Test Board', description: 'Test Description', createdAt: expect.any(String) };

      const result = await service.createBoard(mockBoard as Board);

      expect(db.prepare).toHaveBeenCalledWith('INSERT INTO boards (name, description, created_at) VALUES (?, ?, ?) returning id, name, description, created_at;');
      expect(result).toEqual(expect.objectContaining(expectedBoard));
    });

    it('should throw an error if database insertion fails', async () => {
      const mockBoard: Partial<Board> = { name: 'Test Board', description: 'Test Description' };
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });

      await expect(service.createBoard(mockBoard as Board)).rejects.toThrow('Failed to create board');
    });
  });

  describe('getAllBoards', () => {
    it('should return an array of boards', async () => {
      const mockBoards: Board[] = [
        { id: 1, name: 'Board 1', description: 'Desc 1', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 2, name: 'Board 2', description: 'Desc 2', createdAt: '2024-01-02T00:00:00.000Z' },
      ];
      (db.prepare as jest.Mock).mockReturnValue({ all: jest.fn().mockReturnValue(mockBoards) });

      const result = await service.getAllBoards();

      expect(db.prepare).toHaveBeenCalledWith('SELECT id, name, description, created_at FROM boards');
      expect(result).toEqual(mockBoards);
    });

    it('should throw an error if getting boards fails', async () => {
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ all: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });

      await expect(service.getAllBoards()).rejects.toThrow('Failed to get all boards');
    });
  });

  describe('getBoardById', () => {
    it('should return a board if found', async () => {
      const mockBoard: Board = { id: 1, name: 'Test Board', description: 'Test Description', createdAt: '2024-01-01T00:00:00.000Z' };
      (db.prepare as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue(mockBoard) });

      const result = await service.getBoardById(1);

      expect(db.prepare).toHaveBeenCalledWith('SELECT id, name, description, created_at FROM boards WHERE id = ?');
      expect(result).toEqual(mockBoard);
    });

    it('should return undefined if board is not found', async () => {
      (db.prepare as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue(undefined) });

      const result = await service.getBoardById(999);

      expect(db.prepare).toHaveBeenCalledWith('SELECT id, name, description, created_at FROM boards WHERE id = ?');
      expect(result).toBeUndefined();
    });

    it('should throw an error if getting board by id fails', async () => {
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ get: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });

      await expect(service.getBoardById(1)).rejects.toThrow('Failed to get board by id');
    });
  });

  describe('updateBoard', () => {
    it('should update a board and return the updated board', async () => {
      const boardId = 1;
      const mockBoardUpdate: Partial<Board> = { name: 'Updated Name' };
      const mockExistingBoard: Board = { id: 1, name: 'Original Name', description: 'Desc', createdAt: '2024-01-01T00:00:00.000Z' };
      const mockUpdatedBoard: Board = { ...mockExistingBoard, ...mockBoardUpdate, };
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 1 }) });
      jest.spyOn(service, 'getBoardById').mockResolvedValue(mockUpdatedBoard);

      const result = await service.updateBoard(boardId, mockBoardUpdate);

      expect(db.prepare).toHaveBeenCalledWith('UPDATE boards SET name = ?, description = ? WHERE id = ?');
      expect(result).toEqual(mockUpdatedBoard);
      expect(service.getBoardById).toHaveBeenCalledWith(boardId);
    });

    it('should return the existing board if no update fields are provided', async () => {
        const boardId = 1;
        const mockBoardUpdate: Partial<Board> = {};
        const mockExistingBoard: Board = { id: 1, name: 'Original Name', description: 'Desc', createdAt: '2024-01-01T00:00:00.000Z' };
        jest.spyOn(service, 'getBoardById').mockResolvedValue(mockExistingBoard);

        const result = await service.updateBoard(boardId, mockBoardUpdate);

        expect(db.prepare).not.toHaveBeenCalled();
        expect(result).toEqual(mockExistingBoard);
        expect(service.getBoardById).toHaveBeenCalledWith(boardId);
    });

    it('should throw an error if the board is not found during update', async () => {
      const boardId = 1;
      const mockBoardUpdate: Partial<Board> = { name: 'Updated Name' };
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 0 }) });
      jest.spyOn(service, 'getBoardById').mockResolvedValue(undefined);

      await expect(service.updateBoard(boardId, mockBoardUpdate)).rejects.toThrow('Board with id 1 not found');
      expect(db.prepare).toHaveBeenCalledWith('UPDATE boards SET name = ?, description = ? WHERE id = ?');
      expect(service.getBoardById).toHaveBeenCalledWith(boardId);
    });

    it('should throw an error if the database update fails', async () => {
      const boardId = 1;
      const mockBoardUpdate: Partial<Board> = { name: 'Updated Name' };
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });
      jest.spyOn(service, 'getBoardById').mockResolvedValue({ id: 1, name: 'Original Name', description: 'Desc', createdAt: '2024-01-01T00:00:00.000Z' });

      await expect(service.updateBoard(boardId, mockBoardUpdate)).rejects.toThrow('Failed to update board');
    });
  });

  describe('deleteBoard', () => {
    it('should delete a board', async () => {
      const boardId = 1;
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 1 }) });

      await service.deleteBoard(boardId);

      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM boards WHERE id = ?');
    });

    it('should throw an error if the board is not found', async () => {
      const boardId = 1;
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 0 }) });

      await expect(service.deleteBoard(boardId)).rejects.toThrow('Board with id 1 not found');
    });

    it('should throw an error if the database delete fails', async () => {
      const boardId = 1;
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });

      await expect(service.deleteBoard(boardId)).rejects.toThrow('Failed to delete board');
    });
  });
});