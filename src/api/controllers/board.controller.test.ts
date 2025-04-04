import request from 'supertest';
import express, { Application } from 'express';
import { BoardController } from '../controllers/board.controller';
import { BoardService } from '../services/board.service';
import { Board } from '../types/board';

jest.mock('../services/board.service');

const app: Application = express();
app.use(express.json());

const mockBoardService = {
  createBoard: jest.fn(),
  getAllBoards: jest.fn(),
};

const boardController = new BoardController(mockBoardService as BoardService);
app.post('/boards', boardController.createBoard.bind(boardController));
app.get('/api/boards', boardController.getBoards.bind(boardController));

describe('BoardController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockBoard: Board = {
    id: 1,
    name: 'Test Board',
    description: 'Test Description',
  };

  describe('POST /boards', () => {
    it('should create a board and return 201 with the correct JSON format', async () => {
      (mockBoardService.createBoard as jest.Mock).mockResolvedValue(mockBoard);

      const response = await request(app).post('/boards').send(mockBoard);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(mockBoard);
      expect(mockBoardService.createBoard).toHaveBeenCalledWith(mockBoard);
    });

    it('should return 400 if validation fails', async () => {
      const response = await request(app).post('/boards').send({ name: '', description: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid input');
    });

    it('should return 500 if board creation fails', async () => {
      (mockBoardService.createBoard as jest.Mock).mockRejectedValue(new Error('Failed to create'));

      const response = await request(app).post('/boards').send(mockBoard);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to create board');
    });
  });

  describe('GET /api/boards', () => {
    it('should get all boards and return 200 with the correct JSON format', async () => {
      const mockBoards: Board[] = [mockBoard, { ...mockBoard, id: 2, name: 'Board 2' }];
      (mockBoardService.getAllBoards as jest.Mock).mockResolvedValue(mockBoards);

      const response = await request(app).get('/api/boards');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBoards);
      expect(mockBoardService.getAllBoards).toHaveBeenCalled();
    });

    it('should return 500 if getting all boards fails', async () => {
      (mockBoardService.getAllBoards as jest.Mock).mockRejectedValue(new Error('Failed to get boards'));

      const response = await request(app).get('/api/boards');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to fetch boards');
    });
  });
});
