import request from 'supertest';
import { createIssue } from '../controllers/issueController'; // Add this import
jest.mock('../controllers/issueController'); // Mock the controller module

// Assuming your Express app instance is exported from src/app.ts or similar
// Adjust the path '../app' based on the actual location of your app entry file relative to this test file
import app from '../../app';

describe('Issue Routes', () => {
  // Test for POST /rest/api/2/issue
  it('should return 201 upon successful issue creation via POST /rest/api/2/issue', async () => {
    console.log('TEST: Starting issue creation test...'); // Log start of test
    // Define a realistic request body for creating an issue.
    // This structure mimics a typical Jira API request body for issue creation.
    // You might need to adjust the values (e.g., project key, issue type name)
    // to match what your application's route handler expects or requires.
    const issueData = {
      fields: {
        project: {
          // Replace with a valid project key expected by your application
          key: 'TEST'
        },
        summary: 'Automated test issue creation',
        issuetype: {
          // Replace with a valid issue type name expected by your application
          name: 'Bug'
        },
        // Add other required fields if necessary for your application
        // description: 'This is an issue created by an automated test.',
        // reporter: { name: 'testuser' },
      },
    };

    // Send a POST request to the issue creation endpoint
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueData)
      .set('Accept', 'application/json'); // Optional: Set headers

    console.log('TEST: Received response status:', response.status); // Log response status
    console.log('TEST: Received response body:', JSON.stringify(response.body, null, 2)); // Log response body

    // Assert that the response status code is 201 (Created)
    expect(response.status).toBe(201);

    // Verify that the createIssue controller function was called
    expect(createIssue).toHaveBeenCalledTimes(1); // Add this assertion

    // Optional: Add further assertions about the response body if the API
    // returns details of the created issue (like ID, key, self link).
    // For example:
    // expect(response.body).toHaveProperty('id');
    // expect(response.body).toHaveProperty('key');
    // expect(response.body).toHaveProperty('self');
  }, 10000); // Add timeout of 10000ms

  // Add more tests for other issue-related routes or scenarios as needed
  // e.g., GET /rest/api/2/issue/{issueIdOrKey}, PUT, DELETE, etc.
});
