// tests/routes/index.test.ts
import request from 'supertest';
import { app } from '../../src/app'; // Assuming your app is exported from src/app.ts

describe('Find Issue Endpoint', () => {
  it('should return 200 OK and issue details when the issue exists', async () => {
    const issueKey = 'ATM-1'; // Replace with a valid issue key for testing
    const response = await request(app).get(`/api/issues/${issueKey}`);

    expect(response.status).toBe(200);
    // Add assertions to check the response body for the issue details
    // Example:
    // expect(response.body.key).toBe(issueKey);
  });

  it('should return 404 Not Found when the issue does not exist', async () => {
    const issueKey = 'NON-EXISTENT-ISSUE';
    const response = await request(app).get(`/api/issues/${issueKey}`);

    expect(response.status).toBe(404);
  });

  // Add more test cases as needed, e.g., for error handling, invalid input, etc.
});
