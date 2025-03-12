// tests/routes/issue_link.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Issue Link Route', () => {
  it('should return a 200 status code on successful linking', async () => {
    const response = await request(app).post('/api/issues/link').send({ issueId: 'issue-1', linkedIssueId: 'issue-2', linkType: 'relates to' });
    expect(response.statusCode).toBe(200);
  });

  it('should return a success message', async () => {
    const response = await request(app).post('/api/issues/link').send({ issueId: 'issue-1', linkedIssueId: 'issue-2', linkType: 'relates to' });
    expect(response.body).toHaveProperty('message', 'Issue linked successfully');
  });
});