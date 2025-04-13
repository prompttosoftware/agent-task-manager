import request from 'supertest';
import express from 'express';
import { BoardController } from './board.controller';
import { BoardService } from '../services/board.service';
import { boardRoutes } from '../routes/board.routes';
import { Board } from '../types/board.d.ts';

jest.mock('../services/board.service');

const app = express();
app.use(express.json());

describe('BoardController', () => {
  let boardService: BoardService;
  let boardController: BoardController;
  const mockBoard: Board = {
    id: '1',
    name: 'Test Board',
    description: 'Test Description',
  };

  beforeEach(() => {
    boardService = new BoardService();
    boardController = new BoardController(boardService);

    // Mock the board service methods
    (boardService.getBoardById as jest.Mock).mockClear();
    (boardService.listBoards as jest.Mock).mockClear();
    (boardService.createBoard as jest.Mock).mockClear();
    (boardService.updateBoard as jest.Mock).mockClear();
    (boardService.deleteBoard as jest.Mock).mockClear();

    // Setup routes with the mocked controller
    const router = boardRoutes(boardController);
    app.use('/boards', router);
  });

  describe('GET /boards/:boardId', () => {
    it('should return a board if it exists', async () => {
      (boardService.getBoardById as jest.Mock).mockResolvedValue(mockBoard);

      const response = await request(app).get('/boards/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBoard);
      expect(boardService.getBoardById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if board does not exist', async () => {
      (boardService.getBoardById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/boards/1');

      expect(response.status).toBe(404);
      expect(boardService.getBoardById).toHaveBeenCalledWith('1');
    });

    it('should return 500 if there is an error', async () => {
      (boardService.getBoardById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/boards/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to retrieve board', error: 'Database error' });
      expect(boardService.getBoardById).toHaveBeenCalledWith('1');
    });
  });

  describe('GET /boards', () => {
    it('should return a list of boards', async () => {
      (boardService.listBoards as jest.Mock).mockResolvedValue([mockBoard]);

      const response = await request(app).get('/boards');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockBoard]);
      expect(boardService.listBoards).toHaveBeenCalled();
    });

    it('should return 500 if there is an error', async () => {
      (boardService.listBoards as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/boards');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to list boards', error: 'Database error' });
      expect(boardService.listBoards).toHaveBeenCalled();
    });
  });

  describe('POST /boards', () => {
    it('should create a new board and return 201', async () => {
      (boardService.createBoard as jest.Mock).mockResolvedValue(mockBoard);

      const response = await request(app).post('/boards').send({ name: 'New Board', description: 'New Description' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockBoard);
      expect(boardService.createBoard).toHaveBeenCalledWith({ name: 'New Board', description: 'New Description' });
    });

    it('should return 400 if validation fails', async () => {
        const response = await request(app).post('/boards').send({ description: 'New Description' });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        // You might want to add more specific checks for error messages
      });

    it('should return 500 if there is an error', async () => {
      (boardService.createBoard as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/boards').send({ name: 'New Board', description: 'New Description' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to create board', error: 'Database error' });
      expect(boardService.createBoard).toHaveBeenCalledWith({ name: 'New Board', description: 'New Description' });
    });
  });

  describe('PUT /boards/:boardId', () => {
    it('should update a board and return 200', async () => {
      (boardService.updateBoard as jest.Mock).mockResolvedValue(mockBoard);

      const response = await request(app).put('/boards/1').send({ name: 'Updated Board', description: 'Updated Description' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBoard);
      expect(boardService.updateBoard).toHaveBeenCalledWith('1', { name: 'Updated Board', description: 'Updated Description' });
    });

    it('should return 400 if validation fails', async () => {
        const response = await request(app).put('/boards/1').send({ description: 'Updated Description' });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        // You might want to add more specific checks for error messages
      });

    it('should return 404 if board does not exist', async () => {
      (boardService.updateBoard as jest.Mock).mockResolvedValue(null);

      const response = await request(app).put('/boards/1').send({ name: 'Updated Board', description: 'Updated Description' });

      expect(response.status).toBe(404);
      expect(boardService.updateBoard).toHaveBeenCalledWith('1', { name: 'Updated Board', description: 'Updated Description' });
    });

    it('should return 500 if there is an error', async () => {
      (boardService.updateBoard as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).put('/boards/1').send({ name: 'Updated Board', description: 'Updated Description' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to update board', error: 'Database error' });
      expect(boardService.updateBoard).toHaveBeenCalledWith('1', { name: 'Updated Board', description: 'Updated Description' });
    });
  });

  describe('DELETE /boards/:boardId', () => {
    it('should delete a board and return 204', async () => {
      (boardService.deleteBoard as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/boards/1');

      expect(response.status).toBe(204);
      expect(boardService.deleteBoard).toHaveBeenCalledWith('1');
    });

    it('should return 404 if board does not exist', async () => {
      (boardService.deleteBoard as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/boards/1');

      expect(response.status).toBe(404);
      expect(boardService.deleteBoard).toHaveBeenCalledWith('1');
    });

    it('should return 500 if there is an error', async () => {
      (boardService.deleteBoard as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/boards/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Failed to delete board', error: 'Database error' });
      expect(boardService.deleteBoard).toHaveBeenCalledWith('1');
    });
  });
});