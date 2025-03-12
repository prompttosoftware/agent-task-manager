// tests/routes/delete_issue_nonexistent.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('DELETE /api/issue/:issueKey - Handling non-existent issue', () => {
  it('should return 404 Not Found when deleting a non-existent issue', async () => {
    const nonExistentIssueKey = 'ATM-9999'; // Assuming this issue key does not exist
    const response = await request(app).delete(`/api/issue/${nonExistentIssueKey}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined(); // Or a more specific error message if the API defines one
  });
});
