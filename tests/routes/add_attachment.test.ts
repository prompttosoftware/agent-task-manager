// tests/routes/add_attachment.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Add Attachment Route', () => {
  it('should return a 200 status code', async () => {
    const response = await request(app).post('/api/attachments').send({ issueId: 'issue-123', filename: 'test.txt', content: 'some content' });
    expect(response.statusCode).toBe(200);
  });

  it('should handle attachment upload', async () => {
    const response = await request(app).post('/api/attachments').send({ issueId: 'issue-123', filename: 'test.txt', content: 'some content' });
    expect(response.body).toHaveProperty('message', 'Attachment added successfully');
  });
});