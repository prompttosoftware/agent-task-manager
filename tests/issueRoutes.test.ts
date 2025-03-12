// tests/issueRoutes.test.ts

import request from 'supertest';
import app from '../src/app';

describe('Issue Routes', () => {
  it('should return a 200 status for GET /api/issues', async () => {
    const response = await request(app).get('/api/issues');
    expect(response.statusCode).toBe(200);
  });

  // Add more tests for other endpoints and core logic here

  it('should return a 200 status for GET /api/issues/:id', async () => {
    // Assuming you have a way to create an issue in the database for testing
    const issueId = 'some-issue-id'; // Replace with a valid issue ID if you can create one in the test
    const response = await request(app).get(`/api/issues/${issueId}`);
    expect(response.statusCode).toBe(200);
  });

  // Example failing test (to demonstrate the test setup works).
  it('should fail', () => {
    expect(true).toBe(false);
  });
});