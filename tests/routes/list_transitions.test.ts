// tests/routes/list_transitions.test.ts
import request from 'supertest';
import { app } from '../../src/app'; // Assuming your app is exported from src/app.ts

describe('List Transitions Endpoint', () => {
  it('should return a list of transitions for a given issue key', async () => {
    // Assuming you have an issue key to test with. Replace with a valid issue key if necessary.
    const issueKey = 'ATM-1';
    const response = await request(app)
      .get(`/api/transitions/${issueKey}`)
      .expect(200);

    // Add assertions based on the expected response structure and content
    expect(response.body).toBeDefined();
    // For example:
    // expect(response.body).toBeInstanceOf(Array);
    // response.body.forEach(transition => {
    //  expect(transition).toHaveProperty('id');
    //  expect(transition).toHaveProperty('name');
    // })
  });

  it('should return 404 if the issue key does not exist', async () => {
    const issueKey = 'NON-EXISTENT-ISSUE';
    await request(app)
      .get(`/api/transitions/${issueKey}`)
      .expect(404);
  });
});