// tests/issueTransition.test.ts
import request from 'supertest';
import { app } from '../src/app'; // Assuming your app is exported from src/app.ts

describe('Transition Issue Endpoint', () => {
  it('should transition an issue successfully', async () => {
    const issueKey = 'ATM-123'; // Replace with a valid issue key for testing
    const transitionId = '21'; // Replace with a valid transition ID (In Progress)
    const token = 'your_test_token'; // Replace with a valid token for authentication

    const res = await request(app)
      .post(`/api/issues/${issueKey}/transitions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ transitionId });

    expect(res.statusCode).toEqual(200); // Or whatever status code is expected on success
    // Add more assertions based on the expected response body, e.g.,
    // expect(res.body.status).toEqual('in progress');
  });

  it('should return 400 if no transitionId is provided', async () => {
    const issueKey = 'ATM-123';
    const token = 'your_test_token';

    const res = await request(app)
      .post(`/api/issues/${issueKey}/transitions`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toEqual(400);
  });

  it('should return 404 if the issue is not found', async () => {
    const issueKey = 'NON-EXISTENT-ISSUE';
    const transitionId = '21';
    const token = 'your_test_token';

    const res = await request(app)
      .post(`/api/issues/${issueKey}/transitions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ transitionId });

    expect(res.statusCode).toEqual(404);
  });

  it('should return 401 if no token is provided', async () => {
      const issueKey = 'ATM-123';
      const transitionId = '21';

      const res = await request(app)
          .post(`/api/issues/${issueKey}/transitions`)
          .send({transitionId});

      expect(res.statusCode).toEqual(401);
  })
});
