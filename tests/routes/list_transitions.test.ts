// tests/routes/list_transitions.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('List Transitions Route', () => {
  it('should return a 200 status code', async () => {
    const response = await request(app).get('/api/issues/issue-123/transitions');
    expect(response.statusCode).toBe(200);
  });

  it('should return a list of transitions', async () => {
    const response = await request(app).get('/api/issues/issue-123/transitions');
    expect(response.body).toBeInstanceOf(Array);
  });
});