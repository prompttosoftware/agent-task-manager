// tests/routes/transition_issue.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Transition Issue Route', () => {
  it('should transition an issue to a new state', async () => {
    // Mock issue data and transition details as needed. This will depend on your app's implementation
    // For example:
    const issueKey = 'ATM-123'; // Replace with an actual issue key
    const transitionId = '31'; // Done
    const response = await request(app)
      .post(`/api/issue/${issueKey}/transition`)
      .send({ transitionId });

    expect(response.statusCode).toBe(200); // Or the expected status code
    // Add more assertions based on the expected response, e.g.,
    // expect(response.body.status).toBe('done');
  });

  // Add more tests for different scenarios, such as:
  // - Transitioning to different states
  // - Handling invalid transition IDs
  // - Handling unauthorized transitions

  it('should handle invalid transition ID', async () => {
    const issueKey = 'ATM-123';
    const transitionId = '999'; // Invalid ID

    const response = await request(app)
      .post(`/api/issue/${issueKey}/transition`)
      .send({ transitionId });

    expect(response.statusCode).toBe(400); // Or the appropriate error code
    // Check error message if needed
  });
});