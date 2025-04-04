import { Request, Response } from 'express';
import { BoardController } from './board.controller';
import { BoardService } from '../services/board.service';
import { Board } from '../types/board';

// Mock the BoardService
jest.mock('../services/board.service');

describe('BoardController', () => {
  let boardController: BoardController;
  let mockBoardService: jest.Mocked<BoardService>;

  beforeEach(() => {
    // Reset the mock before each test
    jest.clearAllMocks();
    mockBoardService = new BoardService() as jest.Mocked<BoardService>;
    boardController = new BoardController();
  });

  describe('getBoards', (
  ) => {
    it('should return 200 and an array of boards', async () => {
      const mockBoards: Board[] = [
        { id: 1, name: 'Test Board 1', description: 'Test Description 1' },
        { id: 2, name: 'Test Board 2', description: 'Test Description 2' },
      ];
      mockBoardService.getBoards.mockResolvedValue(mockBoards);

      const mockReq = {} as Request;
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

      await boardController.getBoards(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockBoards);
      expect(mockBoardService.getBoards).toHaveBeenCalled();
    });

    it('should return 500 if an error occurs', async () => {
      const errorMessage = 'Database error';
      mockBoardService.getBoards.mockRejectedValue(new Error(errorMessage));

      const mockReq = {} as Request;
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

      await boardController.getBoards(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to get boards' });
      expect(mockBoardService.getBoards).toHaveBeenCalled();
    });
  });

  describe('getBoardById', () => {
    it('should return 200 and the board if found', async () => {
      const mockBoard: Board = { id: 1, name: 'Test Board', description: 'Test Description' };
      mockBoardService.getBoardById.mockResolvedValue(mockBoard);

      const mockReq = { params: { boardId: '1' } } as unknown as Request;
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

      await boardController.getBoardById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockBoard);
      expect(mockBoardService.getBoardById).toHaveBeenCalledWith(1);
    });

    it('should return 400 if boardId is invalid', async () => {
      const mockReq = { params: { boardId: 'abc' } } as unknown as Request;
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

      await boardController.getBoardById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid boardId' });
      expect(mockBoardService.getBoardById).not.toHaveBeenCalled();
    });

    it('should return 404 if board is not found', async () => {
      mockBoardService.getBoardById.mockResolvedValue(undefined);

      const mockReq = { params: { boardId: '1' } } as unknown as Request;
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

      await boardController.getBoardById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Board not found' });
      expect(mockBoardService.getBoardById).toHaveBeenCalledWith(1);
    });

    it('should return 500 if an error occurs', async () => {
      const errorMessage = 'Database error';
      mockBoardService.getBoardById.mockRejectedValue(new Error(errorMessage));

      const mockReq = { params: { boardId: '1' } } as unknown as Request;
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

      await boardController.getBoardById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error getting board' });
      expect(mockBoardService.getBoardById).toHaveBeenCalledWith(1);
    });
  });
});