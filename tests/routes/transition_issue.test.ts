// tests/routes/transition_issue.test.ts
import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported from app.ts

describe('Transition Issue Endpoint', () => {
  it('should transition an issue to In Progress', async () => {
    // Assuming you have an issue with ID '1' and status 'Open'
    const issueId = '1';
    const transitionId = '2'; // Assuming 2 is the transition to 'In Progress'
    const response = await request(app)
      .post(`/api/issues/${issueId}/transitions`)
      .send({ transitionId: transitionId });

    expect(response.statusCode).toBe(200);
    // Add assertions to verify the issue's status is now 'In Progress'
    // For example, if your API returns the updated issue:
    expect(response.body.status).toBe('In Progress');
  });

  it('should return 404 if issue is not found', async () => {
    const issueId = '999'; // Non-existent issue
    const transitionId = '2';
    const response = await request(app)
      .post(`/api/issues/${issueId}/transitions`)
      .send({ transitionId: transitionId });

    expect(response.statusCode).toBe(404);
  });

  it('should handle invalid transitionId', async () => {
    const issueId = '1';
    const transitionId = '999'; // Invalid transition ID
    const response = await request(app)
      .post(`/api/issues/${issueId}/transitions`)
      .send({ transitionId: transitionId });
    // Assuming the API handles invalid transitionId and returns an appropriate status code, e.g., 400 or 500.
    expect(response.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('should return 400 if transitionId is missing', async () => {
    const issueId = '1';
    const response = await request(app)
      .post(`/api/issues/${issueId}/transitions`)
      .send({}); // Missing transitionId
    expect(response.statusCode).toBe(400);
  });
});