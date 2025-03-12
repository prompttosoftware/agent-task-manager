// tests/routes/issueDelete.test.ts
import request from 'supertest';
import app from '../../src/app';
import { createIssue, deleteIssue, getIssue } from '../utils/issueHelper';

describe('Delete Issue Endpoint', () => {
  it('should successfully delete an issue and return 204 No Content', async () => {
    // 1. Create a new issue
    const issueData = {
      summary: 'Test Issue for Deletion',
      description: 'This is a test issue created for deletion testing.',
      // Assuming you have a default project or need to specify one
    };
    const createdIssue = await createIssue(issueData);
    const issueKey = createdIssue.key;

    // 2. Delete the created issue
    const deleteResponse = await deleteIssue(issueKey);

    // 3. Verify that the issue is successfully deleted (e.g., by attempting to retrieve it and confirming it's not found)
    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await getIssue(issueKey);
    expect(getResponse.statusCode).toBe(404);


  });
});