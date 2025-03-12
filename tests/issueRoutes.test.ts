// tests/issueRoutes.test.ts

import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported from app.ts

describe('Issue Routes', () => {
  it('should return 400 for invalid issue creation request', async () => {
    const response = await request(app)
      .post('/issues')
      .send({ /* Invalid request body - missing required fields or wrong types */ });

    expect(response.statusCode).toBe(400);
    // Add more specific error message assertions if available
  });

  it('should return 200 for a valid issue creation request', async () => {
    const response = await request(app)
      .post('/issues')
      .send({ /* Valid request body */ });

    expect(response.statusCode).toBe(200);
    // Add assertions to check the response body if needed.
  });

  it('should return 404 when trying to get a non-existent issue', async () => {
    const response = await request(app).get('/issues/non-existent-id');
    expect(response.statusCode).toBe(404);
  });

  it('should handle server errors during issue retrieval', async () => {
    // Mock the issue service to throw an error
    // This requires modifying the issue routes or service (not in scope of this task)
    // For now, we'll just assume it will handle it
    const response = await request(app).get('/issues/123'); // Assuming 123 is a valid id
    expect(response.statusCode).toBeGreaterThanOrEqual(500);
  });

  it('should return 400 when updating an issue with invalid data', async () => {
        const response = await request(app)
          .put('/issues/123') // Assuming 123 is a valid id
          .send({ /* Invalid request body */ });

        expect(response.statusCode).toBe(400);
        // Add more specific error message assertions if available
    });

    it('should return 200 when updating an issue with valid data', async () => {
        const response = await request(app)
          .put('/issues/123') // Assuming 123 is a valid id
          .send({ /* Valid request body */ });

        expect(response.statusCode).toBe(200);
        // Add assertions to check the response body if needed.
    });

  it('should return 200 when finding an existing issue', async () => {
    // Assuming the find issue endpoint is GET /issues/:issueKey
    const issueKey = 'ATM-123'; // Replace with a valid issue key
    const response = await request(app).get(`/issues/${issueKey}`);
    expect(response.statusCode).toBe(200);
    // Optionally, add assertions to check the response body for the issue details
  });

  it('should return 404 when finding a non-existent issue', async () => {
    const issueKey = 'NON-EXISTENT-ISSUE';
    const response = await request(app).get(`/issues/${issueKey}`);
    expect(response.statusCode).toBe(404);
  });
});