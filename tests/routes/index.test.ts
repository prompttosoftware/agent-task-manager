// tests/routes/index.test.ts

import request from 'supertest';
import app from '../../src/app';

describe('Initial Setup Tests', () => {
  it('should return 200 for a basic setup check', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});