import request from 'supertest';
import app from './app'; // Assuming app.ts exports the server instance or Express app

describe('GET /', () => {
  it('should respond with 200', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});

describe('POST /rest/api/2/issue', () => {
  // This test confirms the endpoint exists and returns 201, but doesn't send a body or check the response body structure.
  // It might pass even if the controller logic is incomplete.
  it('should respond with 201', async () => {
    const response = await request(app).post('/rest/api/2/issue');
    expect(response.statusCode).toBe(201);
  });

  // This new test simulates a happy path request by sending a valid body
  // and asserts both the 201 status and the expected structure of the response body.
  // It is expected to fail initially because the current controller returns
  // a different body structure ({ message: ... }) than expected ({ id, key, self }).
  it('should respond with 201 and return issue details on successful creation', async () => {
    const newIssue = {
      summary: 'Test Issue Summary',
      description: 'This is a test issue description.',
      projectKey: 'TEST',
      issueType: 'Bug',
      // Add other fields as per API contract if known
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(newIssue)
      .set('Accept', 'application/json'); // Indicate we expect JSON response

    // Assert the status code is 201 Created
    expect(response.statusCode).toBe(201);

    // Assert the response body structure matches the expected successful creation response
    // This check makes the test fail with the current placeholder controller implementation
    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty('id'); // Expected JIRA-like response properties
    expect(response.body).toHaveProperty('key');
    expect(response.body).toHaveProperty('self');
    // Further checks could be added, e.g., expect(typeof response.body.id).toBe('string')
  });
});
