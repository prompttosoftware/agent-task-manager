// tests/issueRoutes.test.ts
import request from 'supertest';
import app from '../src/app'; // Assuming your app is exported from app.ts

describe('Issue Link Endpoint', () => {
  it('should return 200 OK when linking issues', async () => {
    const response = await request(app)
      .post('/api/issue/link') // Assuming the endpoint is /api/issue/link
      .send({ // Example request body
        issueKey: 'ATM-1',
        linkedIssueKey: 'ATM-2',
        linkType: 'Relates'
      });

    expect(response.statusCode).toBe(200);
    // You might want to add more specific assertions here based on the expected response body.
  });

  it('should return 400 if required parameters are missing', async () => {
        const response = await request(app)
          .post('/api/issue/link')
          .send({issueKey: 'ATM-1', linkType: 'Relates'}); // Missing linkedIssueKey
        expect(response.statusCode).toBe(400);
    });
});