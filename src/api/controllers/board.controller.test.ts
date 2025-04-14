import request from 'supertest';
import { app } from '../../app'; // Assuming you have an app instance
import { boardService } from '../services/board.service';
import { v4 as uuidv4 } from 'uuid';
import { Board } from '../../types/board.d';
import { db } from '../../data/db';

// jest.mock('../services/board.service');

describe('PUT /boards/:boardId', () => {
  beforeEach(async () => {
    // Clear the database before each test
    // Assuming you have a function to reset your in-memory database
    await db.reset();
  });

  it('should update a board and return 200', async () => {
    const boardId = uuidv4();
    const updateData = { name: 'Updated Board Name', description: 'Updated Description' };
    const initialBoard: Board = {
      id: boardId,
      name: 'Initial Name',
      description: 'Initial Description'
    }
    await db.boards.create(initialBoard);

    const response = await request(app)
      .put(`/api/boards/${boardId}`)
      .send(updateData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.name).toEqual(updateData.name);
    expect(response.body.description).toEqual(updateData.description);
  });

  it('should return 400 if boardId is invalid', async () => {
    const invalidBoardId = 'invalid-id';
    const response = await request(app).put(`/api/boards/${invalidBoardId}`).send({ name: 'test' });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid boardId');
  });

  it('should return 400 if request body is invalid', async () => {
    const boardId = uuidv4();
    const response = await request(app).put(`/api/boards/${boardId}`).send({ name: 123 }); // Invalid name
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('"name" must be a string');
  });

  it('should return 404 if board is not found', async () => {
    const boardId = uuidv4();
    const updateData = { name: 'Updated Name' };

    const response = await request(app)
      .put(`/api/boards/${boardId}`)
      .send(updateData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Board not found' });
  });

  it('should return 500 if an internal server error occurs', async () => {
    const boardId = uuidv4();
    const updateData = { name: 'Updated Name', description: 'Updated Description' };
    // Mock the db.boards.update function to throw an error
    jest.spyOn(db.boards, 'update').mockRejectedValue(new Error('Database error'));
    
    const response = await request(app)
      .put(`/api/boards/${boardId}`)
      .send(updateData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Database error');
    jest.restoreAllMocks();
  });
});