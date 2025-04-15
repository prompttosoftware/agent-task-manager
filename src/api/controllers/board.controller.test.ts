import request from 'supertest';
import { Express } from 'express';
import { setupApp } from '../../app';

describe('Board Controller', () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupApp();
  });

  it('should create a board', async () => {
    const response = await request(app)
      .post('/api/boards')
      .send({ name: 'Test Board' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Board');
  });
});