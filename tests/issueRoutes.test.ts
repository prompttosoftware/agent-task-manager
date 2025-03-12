// tests/issueRoutes.test.ts

import request from 'supertest';
import app from '../src/app'; // Assuming your app is exported from app.ts


describe('Issue Routes - Board and Label Integration', () => {
  it('GET /issues/:issueKey should return issue with board and labels', async () => {
    const issueKey = 'ATM-1'; // Replace with a valid issue key if available
    const response = await request(app).get(`/issues/${issueKey}`);

    expect(response.statusCode).toBe(200); // Assuming success status
    // Add assertions to check for board and labels in the response
    expect(response.body).toHaveProperty('board');
    expect(response.body).toHaveProperty('labels');
    // You might want to add more specific checks based on the expected data structure
  });

  it('POST /issues should create an issue with board and labels', async () => {
    const newIssue = {
      summary: 'Test Issue with Board and Labels',
      description: 'This is a test issue.',
      board: { id: 'board1', name: 'Test Board' }, // Example board data
      labels: [{ id: 'label1', name: 'Test Label' }], // Example label data
    };

    const response = await request(app).post('/issues').send(newIssue);

    expect(response.statusCode).toBe(201); // Assuming success status for creation
    // Add assertions to check if the created issue contains board and labels
    expect(response.body).toHaveProperty('board');
    expect(response.body).toHaveProperty('labels');
  });

  it('PUT /issues/:issueKey should update an issue with board and labels', async () => {
    const issueKey = 'ATM-1'; // Replace with a valid issue key
    const updatedIssue = {
      board: { id: 'board2', name: 'Updated Board' }, // Example updated board data
      labels: [{ id: 'label2', name: 'Updated Label' }], // Example updated label data
    };

    const response = await request(app).put(`/issues/${issueKey}`).send(updatedIssue);

    expect(response.statusCode).toBe(200); // Assuming success status for update
    // Add assertions to check if the issue was updated correctly
    expect(response.body).toHaveProperty('board');
    expect(response.body).toHaveProperty('labels');
  });
});
