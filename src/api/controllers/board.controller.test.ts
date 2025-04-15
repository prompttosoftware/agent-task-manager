import request from 'supertest';
import { Express } from 'express';
import { setupApp } from '../../../src/app';
import { CreateBoardDto } from '../../../src/api/dto/create-board.dto';
import { Board } from '../../../src/types/board.d';

describe('BoardController', () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupApp();
  });

  it('should create a board', async () => {
    const createBoardDto: CreateBoardDto = {
      name: 'Test Board',
      description: 'Test Description',
    };

    const response = await request(app)
      .post('/api/boards')
      .send(createBoardDto);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(createBoardDto.name);
    expect(response.body.description).toBe(createBoardDto.description);
  });

  it('should get a board by id', async () => {
    // First, create a board
    const createBoardDto: CreateBoardDto = {
      name: 'Test Board',
      description: 'Test Description',
    };
    const createResponse = await request(app)
      .post('/api/boards')
      .send(createBoardDto);
    const boardId = createResponse.body.id;

    const response = await request(app)
      .get(`/api/boards/${boardId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(boardId);
    expect(response.body.name).toBe(createBoardDto.name);
    expect(response.body.description).toBe(createBoardDto.description);
  });

  it('should return 404 if board not found', async () => {
    const invalidBoardId = 'nonexistent-id';
    const response = await request(app)
      .get(`/api/boards/${invalidBoardId}`);
    expect(response.statusCode).toBe(404);
  });

  it('should update a board', async () => {
    // First, create a board
    const createBoardDto: CreateBoardDto = {
      name: 'Test Board',
      description: 'Test Description',
    };
    const createResponse = await request(app)
      .post('/api/boards')
      .send(createBoardDto);
    const boardId = createResponse.body.id;

    // Then, update the board
    const updateBoardDto = {
      name: 'Updated Board Name',
      description: 'Updated Description',
    };
    const response = await request(app)
      .put(`/api/boards/${boardId}`)
      .send(updateBoardDto);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(boardId);
    expect(response.body.name).toBe(updateBoardDto.name);
    expect(response.body.description).toBe(updateBoardDto.description);
  });

  it('should delete a board', async () => {
    // First, create a board
    const createBoardDto: CreateBoardDto = {
      name: 'Test Board',
      description: 'Test Description',
    };
    const createResponse = await request(app)
      .post('/api/boards')
      .send(createBoardDto);
    const boardId = createResponse.body.id;

    // Then, delete the board
    const response = await request(app)
      .delete(`/api/boards/${boardId}`);

    expect(response.statusCode).toBe(204);
  });

  it('should return 400 if invalid data is sent', async () => {
      const createBoardDto = {
          name: '', // Invalid - empty name
          description: 'Test Description',
      };
      const response = await request(app)
          .post('/api/boards')
          .send(createBoardDto);
      expect(response.statusCode).toBe(400);
  });
});