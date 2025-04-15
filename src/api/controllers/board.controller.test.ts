import request from 'supertest';
import { Express } from 'express';
import { setupApp } from '../../../src/app'; // Corrected import path
import { Board, CreateBoardData } from '../../../src/types/board';

describe('Board Controller', () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupApp();
  });

  it('should create a board', async () => {
    const response = await request(app)
      .post('/api/boards')
      .send({ name: 'Test Board', description: 'Test Description' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Board');
  });
});