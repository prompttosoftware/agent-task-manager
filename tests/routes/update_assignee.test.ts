// tests/routes/update_assignee.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Update Assignee Route', () => {
  it('should return a 200 status code on successful update', async () => {
    const response = await request(app).put('/api/issues/issue-123/assignee').send({ assignee: 'user1' });
    expect(response.statusCode).toBe(200);
  });

  it('should return a success message', async () => {
    const response = await request(app).put('/api/issues/issue-123/assignee').send({ assignee: 'user1' });
    expect(response.body).toHaveProperty('message', 'Assignee updated successfully');
  });
});