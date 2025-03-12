// tests/routes/index.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Index Route', () => {
  it('should return a 200 status code', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });

  it('should return a welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.text).toContain('Welcome to the Agent Task Manager API');
  });
});