// tests/issueRoutes.test.ts

import request from 'supertest';
import { app } from '../src/app';

describe('Issue Routes', () => {
  it('should update the assignee of an issue', async () => {
    const issueKey = 'ATM-123'; // Replace with a valid issue key for testing
    const newAssignee = 'user.name'; // Replace with a valid assignee

    const response = await request(app)
      .put(`/api/issues/${issueKey}/assignee`)
      .send({ assignee: newAssignee });

    expect(response.statusCode).toBe(200); // Or the expected status code for a successful update
    // Add more assertions to validate the response body or database state after the update
    expect(response.body).toEqual(expect.objectContaining({ assignee: newAssignee })); // Example assertion
  });
});