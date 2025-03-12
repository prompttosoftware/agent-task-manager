// tests/routes/transition_issue.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Transition Issue Route', () => {
  it('should return a 200 status code on successful transition', async () => {
    const response = await request(app).post('/api/issues/issue-123/transition').send({ transitionId: '31' });
    expect(response.statusCode).toBe(200);
  });

  it('should return a success message', async () => {
    const response = await request(app).post('/api/issues/issue-123/transition').send({ transitionId: '31' });
    expect(response.body).toHaveProperty('message', 'Issue transitioned successfully');
  });
});