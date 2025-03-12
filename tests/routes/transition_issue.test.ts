// tests/routes/transition_issue.test.ts
import request from 'supertest';
import { app } from '../../src/app'; // Assuming you have an app.ts file

describe('Transition Issue Endpoint', () => {
  it('should return 200 OK when transitioning an issue', async () => {
    const issueKey = 'ATM-1'; // Replace with a valid issue key
    const transitionId = '21'; // Replace with a valid transition ID

    const response = await request(app)
      .post(`/api/issues/${issueKey}/transitions`) // Adjust the route as needed
      .send({ transitionId })
      .expect(200);

    expect(response.body).toBeDefined();
    // Add more assertions based on the expected response, e.g.,
    // expect(response.body.status).toBe('In Progress');
  });

  // Add more test cases for different scenarios, e.g.,
  // - Invalid issue key
  // - Invalid transition ID
  // - Unauthorized access
  // - Validation errors
});