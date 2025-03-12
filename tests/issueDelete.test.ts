// tests/issueDelete.test.ts
import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported from app.ts

describe('DELETE /issues/:id', () => {
  it('should respond with 204 if the issue is successfully deleted', async () => {
    const issueId = '123'; // Replace with a valid issue ID for testing.  Consider creating a test issue.
    const response = await request(app).delete(`/issues/${issueId}`);

    expect(response.statusCode).toBe(204);
    // Optionally, check the response body if there is one.
  });

    it('should respond with 404 if the issue is not found', async () => {
    const issueId = 'nonexistent-issue'; // Replace with a non-existent issue ID.
    const response = await request(app).delete(`/issues/${issueId}`);

    expect(response.statusCode).toBe(404);
  });

  // Add more tests for error scenarios, invalid IDs, etc.
});