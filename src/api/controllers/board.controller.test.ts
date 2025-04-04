import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { BoardController } from './board.controller';
import { BoardService } from '../services/board.service';
import { Board } from '../models/board';
import { validate } from 'class-validator';

vi.mock('../services/board.service');
vi.mock('class-validator');

describe('BoardController - POST /boards', () => {
  let boardController: BoardController;
  let mockBoardService: BoardService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockBoardService = new BoardService() as any;
    boardController = new BoardController();
    mockRequest = { body: {} };
    mockResponse = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    (BoardService as any).mockClear();
    (validate as any).mockClear();
  });

  it('should create a board successfully with valid input', async () => {
    const boardData = { name: 'Test Board', description: 'Test Description' };
    mockRequest.body = boardData;
    const createdBoard: Board = { id: '1', ...boardData };
    (BoardService.prototype.createBoard as any).mockResolvedValue(createdBoard);
    (validate as any).mockResolvedValue([]);
    await boardController.createBoard(mockRequest as Request, mockResponse as Response);
    expect(validate).toHaveBeenCalled();
    expect(BoardService.prototype.createBoard).toHaveBeenCalledWith(boardData);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(createdBoard);
  });

  it('should return a 400 status code when input validation fails', async () => {
    const boardData = { name: '', description: '' };
    mockRequest.body = boardData;
    const validationErrors = [{ property: 'name', constraints: { isNotEmpty: 'Name should not be empty' } }];
    (validate as any).mockResolvedValue([{"constraints": {"isNotEmpty": "Name should not be empty"}}]);
    await boardController.createBoard(mockRequest as Request, mockResponse as Response);
    expect(validate).toHaveBeenCalled();
    expect(BoardService.prototype.createBoard).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ errors: [{ isNotEmpty: 'Name should not be empty' }] });
  });

  it('should return a 500 status code when the board service throws an error', async () => {
    const boardData = { name: 'Test Board', description: 'Test Description' };
    mockRequest.body = boardData;
    const errorMessage = 'Failed to create board';
    (BoardService.prototype.createBoard as any).mockRejectedValue(new Error(errorMessage));
    (validate as any).mockResolvedValue([]);
    await boardController.createBoard(mockRequest as Request, mockResponse as Response);
    expect(validate).toHaveBeenCalled();
    expect(BoardService.prototype.createBoard).toHaveBeenCalledWith(boardData);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
  });
});