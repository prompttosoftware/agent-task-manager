// tests/routes/get_issue_create_metadata.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/issue/create/metadata', () => {
  it('should return 200 OK for a valid request', async () => {
    const response = await request(app).get('/api/issue/create/metadata').query({
      projectKey: 'ATM',
      issueType: 'Task',
    });
    expect(response.status).toBe(200);
    // Add more assertions here to validate the response body
  });

  it('should return 400 Bad Request if projectKey is missing', async () => {
    const response = await request(app).get('/api/issue/create/metadata').query({
      issueType: 'Task',
    });
    expect(response.status).toBe(400);
    // Add more assertions here to validate the response body
  });

  it('should return 400 Bad Request if issueType is missing', async () => {
    const response = await request(app).get('/api/issue/create/metadata').query({
      projectKey: 'ATM',
    });
    expect(response.status).toBe(400);
    // Add more assertions here to validate the response body
  });

   it('should return 200 OK for a valid request for a different project', async () => {
    const response = await request(app).get('/api/issue/create/metadata').query({
      projectKey: 'SOME_OTHER_PROJECT',
      issueType: 'Bug',
    });
    expect(response.status).toBe(200);
    // Add more assertions here to validate the response body
  });

  it('should return 200 OK for a valid request for a different issue type', async () => {
    const response = await request(app).get('/api/issue/create/metadata').query({
      projectKey: 'ATM',
      issueType: 'Bug',
    });
    expect(response.status).toBe(200);
    // Add more assertions here to validate the response body
  });

});
