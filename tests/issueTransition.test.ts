// tests/issueTransition.test.ts

import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported from app.ts

describe('List Transitions Endpoint', () => {
  it('should return a 200 status code and a list of transitions for a valid issue key', async () => {
    const issueKey = 'ATM-123'; // Replace with a valid issue key for testing
    const response = await request(app).get(`/api/issues/${issueKey}/transitions`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    // Add more assertions based on the expected structure of the transitions data
  });

  it('should return a 404 status code for an invalid issue key', async () => {
    const issueKey = 'INVALID-123';
    const response = await request(app).get(`/api/issues/${issueKey}/transitions`);

    expect(response.statusCode).toBe(404);
    // Or whatever status code is appropriate for a not found issue
  });

  it('should handle errors gracefully', async () => {
    // Test for server errors, invalid requests, etc.
    const issueKey = 'ATM-123'; // Replace with a valid issue key for testing
    const response = await request(app).get(`/api/issues/${issueKey}/transitions`);

    // Assuming an error will result in 500 status
    expect(response.statusCode).toBeGreaterThanOrEqual(400); // Or whatever error status is returned
    // Consider more specific error message assertions.
  });
});