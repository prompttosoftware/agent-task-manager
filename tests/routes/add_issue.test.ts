// tests/routes/add_issue.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Add new issue endpoint', () => {
  it('should successfully create a new issue and return the issue key/ID', async () => {
    const newIssueData = {
      fields: {
        summary: 'Test Issue from API',
        description: 'This is a test issue created through the API.',
        project: { key: 'ATM' },
        issuetype: { name: 'Task' }
      }
    };

    const response = await request(app)
      .post('/api/issue') // Assuming the endpoint is /api/issue.  Check issueRoutes.ts for actual endpoint
      .send(newIssueData)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(201); // Assuming 201 Created on success
    expect(response.body).toHaveProperty('key'); // Verify the response includes an issue key
    const issueKey = response.body.key;

    // Verify issue details (This part requires an endpoint to retrieve issue by key/id.)
    const getIssueResponse = await request(app)
      .get(`/api/issue/${issueKey}`); // Assuming an endpoint like /api/issue/:issueKey

    expect(getIssueResponse.status).toBe(200);
    expect(getIssueResponse.body.fields.summary).toBe('Test Issue from API');
    expect(getIssueResponse.body.fields.description).toBe('This is a test issue created through the API.');
    // Add more assertions to check other issue details
  });
});
