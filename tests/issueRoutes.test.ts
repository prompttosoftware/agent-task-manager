// tests/issueRoutes.test.ts

import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported from src/app.ts

describe('Issue Routes', () => {
  describe('GET /api/issues/board', () => {
    it('should return a 200 status code', async () => {
      const response = await request(app).get('/api/issues/board');
      expect(response.statusCode).toBe(200);
    });

    it('should return an array of issues', async () => {
      const response = await request(app).get('/api/issues/board');
      expect(Array.isArray(response.body)).toBe(true);
    });

    // Add more tests to validate the response data (e.g., issue properties, etc.)
  });
});
