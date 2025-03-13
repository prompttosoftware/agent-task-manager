// src/tests/server.test.ts
import { app } from '../src/index'; // Assuming your server is exported from index.ts
import request from 'supertest';

describe('Express Server', () => {
  it('should start the server without errors', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(404); // Expecting 404 as there is no route defined. If the server starts, the test should pass.
  });
});