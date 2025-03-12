// tests/routes/update_assignee.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

// Mock the issue and user data as needed
const mockIssueId = 'ATM-123';
const mockUserId = 'user123';

describe('Update Assignee Route', () => {
  it('should assign a user to an issue', async () => {
    const response = await request(app)
      .put(`/api/issues/${mockIssueId}/assignee`)
      .send({ userId: mockUserId });

    expect(response.statusCode).toBe(200); // Assuming success is 200 OK, adjust if needed
    // Add more assertions here to verify the assignee was updated correctly,
    // e.g., check the response body or database state.
  });

  it('should unassign a user from an issue', async () => {
    const response = await request(app)
      .delete(`/api/issues/${mockIssueId}/assignee`)
      .send({ userId: mockUserId });

    expect(response.statusCode).toBe(200); // Adjust if needed
    // Add more assertions here to verify the assignee was removed correctly.
  });

  // Add more tests for error cases, invalid input, etc.
  it('should return 400 if userId is missing', async () => {
    const response = await request(app)
      .put(`/api/issues/${mockIssueId}/assignee`)
      .send({});
    expect(response.statusCode).toBe(400);
  });

});
