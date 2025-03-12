// tests/routes/index.test.ts

import request from 'supertest';
import { app } from '../../src/app'; // Assuming your app is exported from src/app.ts

describe('Index Route', () => {
  it('should return a 200 OK status', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });

  it('should return a specific message', async () => {
    const response = await request(app).get('/');
    expect(response.text).toContain('Hello, world!'); // Replace with expected message
  });
});