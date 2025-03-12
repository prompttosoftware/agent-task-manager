// tests/issueRoutes.test.ts
import request from 'supertest';
import { app } from '../src/app';

describe('Issue Routes', () => {
  it('should add a new issue', async () => {
    const response = await request(app)
      .post('/api/issues')
      .send({ // TODO:  define the correct issue model in issue.ts and then add a valid object here
        summary: 'Test issue',
        description: 'This is a test issue',
      });

    expect(response.statusCode).toBe(201); // Assuming 201 Created is the expected status code
    // TODO: Add more assertions here, e.g., checking the response body for the created issue details.
  });
});
