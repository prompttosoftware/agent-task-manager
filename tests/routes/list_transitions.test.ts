// tests/routes/list_transitions.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('List Transitions Route', () => {
  it('should return a list of transitions for a given issue', async () => {
    // This test assumes that there is an endpoint to list transitions.
    // Replace '/issues/:issueKey/transitions' with the actual route.
    const issueKey = 'ATM-1'; // Replace with an actual issue key if needed
    const response = await request(app).get(`/issues/${issueKey}/transitions`);

    expect(response.status).toBe(200);
    // Add more assertions to validate the response data.
    // For example, check the structure and content of the transitions.
    expect(Array.isArray(response.body)).toBe(true);
    // expect(response.body[0]).toHaveProperty('id');
    // expect(response.body[0]).toHaveProperty('name');
  });

  it('should handle errors gracefully (e.g., issue not found)', async () => {
    const issueKey = 'NON-EXISTENT-ISSUE';
    const response = await request(app).get(`/issues/${issueKey}/transitions`);

    expect(response.status).toBeGreaterThanOrEqual(400);
    // You may need to adjust the assertion based on the expected error response
    // For example, expect(response.body.message).toBe('Issue not found');
  });
});