// src/api/services/board.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoardService } from './board.service';
import db from '../../db/database';
import { BoardCreateDto, BoardUpdateDto, Board } from '../../types/board.d';
import { StatusCodes } from 'http-status-codes';
import { HttpException } from '../../exceptions/HttpException';

// Mock the database module
vi.mock('../../db/database', () => ({
  default: {
    prepare: vi.fn(),
  },
}));

describe('BoardService', () => {
  let boardService: BoardService;

  beforeEach(() => {
    boardService = new BoardService();
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  it('getBoard should return a board when it exists', async () => {
    const mockBoard: Board = { id: '1', name: 'Test Board', description: 'Test Description' };
    const mockGet = vi.fn().mockReturnValue(mockBoard);
    (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

    const board = await boardService.getBoard('1');

    expect(board).toEqual(mockBoard);
    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM boards WHERE id = ?');
    expect(mockGet).toHaveBeenCalledWith('1');
  });

  it('getBoard should return null when the board does not exist', async () => {
    const mockGet = vi.fn().mockReturnValue(undefined);
    (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

    const board = await boardService.getBoard('999');

    expect(board).toBeNull();
    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM boards WHERE id = ?');
    expect(mockGet).toHaveBeenCalledWith('999');
  });

  it('getBoard should throw an error when database query fails', async () => {
    const mockError = new Error('Database error');
    const mockGet = vi.fn().mockImplementation(() => {
      throw mockError;
    });
    (db.prepare as jest.Mock).mockReturnValue({ get: mockGet });

    await expect(boardService.getBoard('1')).rejects.toThrowError(HttpException);
    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM boards WHERE id = ?');
    expect(mockGet).toHaveBeenCalledWith('1');
  });

  it('listBoards should return a list of boards', async () => {
    const mockBoards: Board[] = [
      { id: '1', name: 'Board 1', description: 'Description 1' },
      { id: '2', name: 'Board 2', description: 'Description 2' },
    ];
    const mockAll = vi.fn().mockReturnValue(mockBoards);
    (db.prepare as jest.Mock).mockReturnValue({ all: mockAll });

    const boards = await boardService.listBoards();

    expect(boards).toEqual(mockBoards);
    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM boards');
    expect(mockAll).toHaveBeenCalled();
  });

  it('listBoards should throw an error when database query fails', async () => {
    const mockError = new Error('Database error');
    const mockAll = vi.fn().mockImplementation(() => {
      throw mockError;
    });
    (db.prepare as jest.Mock).mockReturnValue({ all: mockAll });

    await expect(boardService.listBoards()).rejects.toThrowError(HttpException);
    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM boards');
    expect(mockAll).toHaveBeenCalled();
  });

  it('createBoard should create a board successfully', async () => {
    const boardCreateDto: BoardCreateDto = { name: 'New Board', description: 'New Description' };
    const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: '3' });
    (db.prepare as jest.Mock).mockReturnValue({ run: mockRun });

    const createdBoard = await boardService.createBoard(boardCreateDto);

    expect(createdBoard).toEqual({ id: '3', name: 'New Board', description: 'New Description' });
    expect(db.prepare).toHaveBeenCalledWith('INSERT INTO boards (name, description) VALUES (?, ?)');
    expect(mockRun).toHaveBeenCalledWith('New Board', 'New Description');
  });

  it('createBoard should throw an error when validation fails', async () => {
    const boardCreateDto: BoardCreateDto = { name: '', description: '' }; // Invalid data
    const mockValidateOrReject = vi.fn().mockRejectedValue([{ constraints: { notEmpty: 'Name must not be empty' } }]);
    (boardService as any).validateOrReject = mockValidateOrReject; // Directly mock the imported function

    await expect(boardService.createBoard(boardCreateDto)).rejects.toThrowError(HttpException);
    expect(mockValidateOrReject).toHaveBeenCalled();
  });

  it('createBoard should throw an error when database query fails', async () => {
    const boardCreateDto: BoardCreateDto = { name: 'Valid Name', description: 'Valid Description' };
    const mockRun = vi.fn().mockImplementation(() => {
      throw new Error('Database error');
    });
    (db.prepare as jest.Mock).mockReturnValue({ run: mockRun });

    await expect(boardService.createBoard(boardCreateDto)).rejects.toThrowError(HttpException);
    expect(db.prepare).toHaveBeenCalledWith('INSERT INTO boards (name, description) VALUES (?, ?)');
    expect(mockRun).toHaveBeenCalledWith('Valid Name', 'Valid Description');
  });

  it('updateBoard should update a board successfully', async () => {
    const boardId = '1';
    const boardUpdateDto: BoardUpdateDto = { name: 'Updated Name', description: 'Updated Description' };
    const existingBoard: Board = { id: '1', name: 'Original Name', description: 'Original Description' };
    const mockGetBoard = vi.fn().mockResolvedValue(existingBoard);
    const mockRun = vi.fn().mockReturnValue({ changes: 1 });
    const mockGet = vi.fn().mockReturnValue({ ...existingBoard, ...boardUpdateDto });  // Simulate updated board retrieval
    (db.prepare as jest.Mock).mockReturnValue({ run: mockRun });
    (boardService as any).getBoard = mockGetBoard;

    const updatedBoard = await boardService.updateBoard(boardId, boardUpdateDto);

    expect(updatedBoard).toEqual({ ...existingBoard, ...boardUpdateDto });
    expect(db.prepare).toHaveBeenCalledWith('UPDATE boards SET name = ?, description = ? WHERE id = ?');
    expect(mockRun).toHaveBeenCalledWith('Updated Name', 'Updated Description', boardId);
    expect(mockGetBoard).toHaveBeenCalledWith(boardId);
  });

  it('updateBoard should return null if the board does not exist', async () => {
    const boardId = '999';
    const boardUpdateDto: BoardUpdateDto = { name: 'Updated Name', description: 'Updated Description' };
    const mockGetBoard = vi.fn().mockResolvedValue(null);
    (boardService as any).getBoard = mockGetBoard;

    const updatedBoard = await boardService.updateBoard(boardId, boardUpdateDto);

    expect(updatedBoard).toBeNull();
    expect(mockGetBoard).toHaveBeenCalledWith(boardId);
    expect(db.prepare).not.toHaveBeenCalled(); // Ensure the update query is not called.
  });

    it('updateBoard should return the original board if no changes are made', async () => {
        const boardId = '1';
        const boardUpdateDto: BoardUpdateDto = { name: undefined, description: undefined };
        const existingBoard: Board = { id: '1', name: 'Original Name', description: 'Original Description' };
        const mockGetBoard = vi.fn().mockResolvedValue(existingBoard);
        const mockRun = vi.fn().mockReturnValue({ changes: 0 }); // Simulate no changes
        (db.prepare as jest.Mock).mockReturnValue({ run: mockRun });
        (boardService as any).getBoard = mockGetBoard;

        const updatedBoard = await boardService.updateBoard(boardId, boardUpdateDto);

        expect(updatedBoard).toEqual(existingBoard);
        expect(db.prepare).toHaveBeenCalledWith('UPDATE boards SET name = ?, description = ? WHERE id = ?');
        expect(mockRun).toHaveBeenCalledWith(existingBoard.name, existingBoard.description, boardId); // Verify original values used.
        expect(mockGetBoard).toHaveBeenCalledWith(boardId);
    });

  it('updateBoard should throw an error when validation fails', async () => {
    const boardId = '1';
    const boardUpdateDto: BoardUpdateDto = { name: '', description: '' }; // Invalid data
    const mockGetBoard = vi.fn().mockResolvedValue({ id: '1', name: 'Test', description: 'Test' });
    const mockValidateOrReject = vi.fn().mockRejectedValue([{ constraints: { notEmpty: 'Name must not be empty' } }]);
    (boardService as any).validateOrReject = mockValidateOrReject;
    (boardService as any).getBoard = mockGetBoard;

    await expect(boardService.updateBoard(boardId, boardUpdateDto)).rejects.toThrowError(HttpException);
    expect(mockGetBoard).toHaveBeenCalledWith(boardId);
    expect(mockValidateOrReject).toHaveBeenCalled();
  });

  it('updateBoard should throw an error when database query fails', async () => {
    const boardId = '1';
    const boardUpdateDto: BoardUpdateDto = { name: 'Updated Name', description: 'Updated Description' };
    const existingBoard: Board = { id: '1', name: 'Original Name', description: 'Original Description' };
    const mockGetBoard = vi.fn().mockResolvedValue(existingBoard);
    const mockRun = vi.fn().mockImplementation(() => {
      throw new Error('Database error');
    });
    (db.prepare as jest.Mock).mockReturnValue({ run: mockRun });
    (boardService as any).getBoard = mockGetBoard;


    await expect(boardService.updateBoard(boardId, boardUpdateDto)).rejects.toThrowError(HttpException);
    expect(db.prepare).toHaveBeenCalledWith('UPDATE boards SET name = ?, description = ? WHERE id = ?');
    expect(mockRun).toHaveBeenCalledWith('Updated Name', 'Updated Description', boardId);
    expect(mockGetBoard).toHaveBeenCalledWith(boardId);
  });

  it('deleteBoard should delete a board successfully', async () => {
    const boardId = '1';
    const mockRun = vi.fn().mockReturnValue({ changes: 1 });
    (db.prepare as jest.Mock).mockReturnValue({ run: mockRun });

    await boardService.deleteBoard(boardId);

    expect(db.prepare).toHaveBeenCalledWith('DELETE FROM boards WHERE id = ?');
    expect(mockRun).toHaveBeenCalledWith(boardId);
  });

  it('deleteBoard should throw an error if the board does not exist', async () => {
    const boardId = '999';
    const mockRun = vi.fn().mockReturnValue({ changes: 0 });
    (db.prepare as jest.Mock).mockReturnValue({ run: mockRun });

    await expect(boardService.deleteBoard(boardId)).rejects.toThrowError(HttpException);
    expect(db.prepare).toHaveBeenCalledWith('DELETE FROM boards WHERE id = ?');
    expect(mockRun).toHaveBeenCalledWith(boardId);
  });

  it('deleteBoard should throw an error when database query fails', async () => {
    const boardId = '1';
    const mockRun = vi.fn().mockImplementation(() => {
      throw new Error('Database error');
    });
    (db.prepare as jest.Mock).mockReturnValue({ run: mockRun });

    await expect(boardService.deleteBoard(boardId)).rejects.toThrowError(HttpException);
    expect(db.prepare).toHaveBeenCalledWith('DELETE FROM boards WHERE id = ?');
    expect(mockRun).toHaveBeenCalledWith(boardId);
  });
});