// tests/issueRoutes.test.ts

import request from 'supertest';
import app from '../src/app'; // Assuming your app is exported from app.ts

describe('Issue Routes', () => {
  it('GET /issues should return a 200 status code', async () => {
    const res = await request(app).get('/issues');
    expect(res.statusCode).toEqual(200);
  });

  // Add more tests for different routes and methods (POST, PUT, DELETE)
  // For example:
  // it('POST /issues should create a new issue', async () => { ... });
});