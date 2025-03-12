// tests/routes/add_issue.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app instance is exported

describe('Add new issue endpoint', () => {
  it('should successfully create a new issue and return the issue key', async () => {
    const newIssueData = {
      // Provide valid data to create an issue.  Adjust these fields based on your API's requirements
      // For example:
      // projectKey: 'ATM',
      // issueType: 'Task',
      // summary: 'Test Issue Creation',
      // description: 'This is a test issue',
    };

    const response = await request(app)
      .post('/api/issues') // Replace with your actual endpoint
      .send(newIssueData);

    expect(response.statusCode).toBe(201); // Or the appropriate status code for successful creation
    expect(response.body).toHaveProperty('issueKey');

    const issueKey = response.body.issueKey;

    // Verify issue details by retrieving it (requires a GET endpoint for retrieving issues)
    const getResponse = await request(app).get(`/api/issues/${issueKey}`); // Replace with your actual GET endpoint
    expect(getResponse.statusCode).toBe(200);
    // Add more detailed assertions based on your issue model
    // For example, check if the summary matches, etc.
    // expect(getResponse.body.summary).toBe(newIssueData.summary);
  });

  // Add more tests for different scenarios like invalid requests, error handling, etc.
  it('should return an error for an invalid request', async () => {
    const invalidIssueData = {
      // Provide invalid data that would cause a failure
    };

    const response = await request(app)
      .post('/api/issues') // Replace with your actual endpoint
      .send(invalidIssueData);

    expect(response.statusCode).toBeGreaterThanOrEqual(400); // Expect a client error
    // You might want to assert on the error message or structure as well.
  });
});