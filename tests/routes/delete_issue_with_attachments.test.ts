// tests/routes/delete_issue_with_attachments.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from here

describe('DELETE /issue/:issueKey/attachments', () => {
  it('should delete an issue and its attachments when the issue exists', async () => {
    // TODO: Implement the logic to create an issue with attachments before deleting it
    // For now, we'll assume an issue with issueKey 'ATM-123' and attachments exist.
    const issueKey = 'ATM-123';
    const response = await request(app).delete(`/issue/${issueKey}/attachments`);
    
    expect(response.statusCode).toBe(200); // Or the appropriate status code for success
    // TODO: Add assertions to verify that the issue and its attachments are deleted
  });

  it('should return 404 if the issue does not exist', async () => {
    const issueKey = 'NON-EXISTENT-ISSUE';
    const response = await request(app).delete(`/issue/${issueKey}/attachments`);
    
    expect(response.statusCode).toBe(404);
    // TODO: Add assertions to verify the response body
  });

  it('should handle errors during attachment deletion gracefully', async () => {
    // TODO: Implement a scenario where attachment deletion fails (e.g., permission issues, etc.)
    const issueKey = 'ATM-123'; // Assuming an issue exists
    const response = await request(app).delete(`/issue/${issueKey}/attachments`);

    expect(response.statusCode).toBe(500); // Or the appropriate error status code
    // TODO: Add assertions to verify the error response body
  });
});
