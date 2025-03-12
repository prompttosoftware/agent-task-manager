// tests/issueRoutes.test.ts
import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported from src/app.ts

describe('Issue Routes', () => {
  describe('GET /rest/api/2/issue/createmeta', () => {
    it('should return 200 and issue create metadata', async () => {
      const response = await request(app).get('/rest/api/2/issue/createmeta');

      expect(response.statusCode).toBe(200);
      // Add more assertions here to check the response body
      // For example:
      // expect(response.body).toHaveProperty('expand');
      // expect(response.body).toHaveProperty('projects');
    });
  });
});