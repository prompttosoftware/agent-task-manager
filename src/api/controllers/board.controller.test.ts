import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import boardRoutes from '../routes/board.routes';
import { BoardService } from '../services/board.service';
import { Board } from '../models/board';
import { validate } from 'class-validator';

const app = express();
app.use(express.json());
app.use('/api/boards', boardRoutes);

// Mock the BoardService
jest.mock('../services/board.service');
const mockBoardService = BoardService as jest.Mocked<typeof BoardService>;

describe('POST /api/boards', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should create a new board with valid data', async () => {
    const newBoard: Board = {
      name: 'Test Board',
      description: 'Test Description',
    };

    const createdBoard: Board = { ...newBoard, id: 1, createdAt: new Date(), updatedAt: new Date() };

    mockBoardService.prototype.createBoard.mockResolvedValue(createdBoard);

    const response = await request(app)
      .post('/api/boards')
      .send(newBoard)
      .set('Accept', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body).toEqual(createdBoard);
    expect(mockBoardService.prototype.createBoard).toHaveBeenCalledWith(expect.objectContaining(newBoard));
  });

  it('should return 400 for invalid data', async () => {
    const invalidBoardData = {
      name: '', // Invalid: Name is required
      description: 'Test Description',
    };

    const response = await request(app)
      .post('/api/boards')
      .send(invalidBoardData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toBeInstanceOf(Array);
    expect(response.body.errors[0].property).toBe('name');
    expect(mockBoardService.prototype.createBoard).not.toHaveBeenCalled();
  });

  it('should handle server errors', async () => {
    mockBoardService.prototype.createBoard.mockRejectedValue(new Error('Database error'));

    const newBoard: Board = {
      name: 'Test Board',
      description: 'Test Description',
    };

    const response = await request(app)
      .post('/api/boards')
      .send(newBoard);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Failed to create board: Database error' });
  });
});
