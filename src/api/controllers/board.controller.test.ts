import { describe, it, expect, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { BoardController } from './board.controller';
import { BoardService } from '../services/board.service';
import { Board } from '../types/board';

vi.mock('../services/board.service');

describe('BoardController', () => {
  let boardController: BoardController;
  let mockBoardService: BoardService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockBoardService = new BoardService() as any;
    boardController = new BoardController();
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  it('should get all boards', async () => {
    const mockBoards: Board[] = [
      { id: 1, name: 'Board 1', description: 'Description 1' },
      { id: 2, name: 'Board 2', description: 'Description 2' },
    ];
    (mockBoardService.getBoards as any).mockResolvedValue(mockBoards);

    await boardController.getBoards(mockRequest as Request, mockResponse as Response);

    expect(mockBoardService.getBoards).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockBoards);
  });

  it('should handle errors when getting boards', async () => {
    const errorMessage = 'Failed to get boards';
    (mockBoardService.getBoards as any).mockRejectedValue(new Error(errorMessage));

    await boardController.getBoards(mockRequest as Request, mockResponse as Response);

    expect(mockBoardService.getBoards).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
  });
});
