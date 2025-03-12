// tests/issueDelete.test.ts
import request from 'supertest';
import app from '../src/app'; // Assuming your app is exported from src/app.ts
import { createIssue } from './utils'; // Assuming you have a utility function to create issues

describe('Delete Issue Endpoint', () => {
  let issueKey: string;

  beforeAll(async () => {
    // Create a new issue before running tests
    const issue = await createIssue();
    issueKey = issue.key;
  });

  it('should successfully delete an issue and return 204 No Content', async () => {
    const response = await request(app).delete(`/api/issues/${issueKey}`);

    expect(response.status).toBe(204);

    // Verify issue is deleted by attempting to retrieve it (Expect 404 Not Found)
    const getResponse = await request(app).get(`/api/issues/${issueKey}`);
    expect(getResponse.status).toBe(404);
  });

  // Add tests for error scenarios such as deleting a non-existent issue
});
