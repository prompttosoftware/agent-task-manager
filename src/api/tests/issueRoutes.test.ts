import request from 'supertest';
import { createIssue } from '../controllers/issueController'; // Add this import
jest.mock('../controllers/issueController'); // Mock the controller module

// Assuming your Express app instance is exported from src/app.ts or similar
// Adjust the path '../app' based on the actual location of your app entry file relative to this test file
import app from '../../app';

describe('Issue Routes', () => {
  // Test for POST /rest/api/2/issue
  it('should return 201 upon successful issue creation via POST /rest/api/2/issue', async () => {
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

  // Test for POST /rest/api/2/issue with invalid data
  it('should return 400 when request body is missing fields', async () => {
    const invalidIssueData = {}; // Missing fields object

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData)
      .set('Accept', 'application/json');


    expect(response.status).toBe(400);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(response.body).toHaveProperty('message', 'Invalid request body: missing fields object.');
  });

  it('should return 400 when request body is missing project key', async () => {
    const invalidIssueData = {
      fields: {
        summary: 'Automated test issue creation',
        issuetype: {
          name: 'Bug'
        },
      },
    }; // Missing project key

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData)
      .set('Accept', 'application/json');


    expect(response.status).toBe(400);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(response.body).toHaveProperty('message', 'Invalid request body: missing project key.');
  });

  it('should return 400 when request body is missing summary', async () => {
    const invalidIssueData = {
      fields: {
        project: {
          key: 'TEST'
        },
        issuetype: {
          name: 'Bug'
        },
      },
    }; // Missing summary

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData)
      .set('Accept', 'application/json');


    expect(response.status).toBe(400);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(response.body).toHaveProperty('message', 'Invalid request body: missing summary.');
  });

  it('should return 400 when request body is missing issue type name', async () => {
    const invalidIssueData = {
      fields: {
        project: {
          key: 'TEST'
        },
        summary: 'Automated test issue creation',
      },
    }; // Missing issue type name

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData)
      .set('Accept', 'application/json');


    expect(response.status).toBe(400);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(response.body).toHaveProperty('message', 'Invalid request body: missing issue type name.');
  });

  // Test for POST /rest/api/2/issue with invalid parent field (not an object)
  it('should return 400 when parent field is not an object', async () => {
    const invalidIssueData = {
      fields: {
        project: { key: 'TEST' },
        summary: 'Issue with invalid parent',
        issuetype: { name: 'Bug' },
        parent: 'invalid string', // Invalid parent type
      },
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    // The controller should be called before validation happens, but in the test setup,
    // the mock is checked. The route handler calls the controller function.
    // So, createIssue should be called once if the route handler is hit.
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(response.body).toHaveProperty('message', 'Invalid request body: parent field must be an object if provided.');
  });

  // Test for POST /rest/api/2/issue with invalid parent key (missing)
  it('should return 400 when parent key is missing if parent field is an object', async () => {
    const invalidIssueData = {
      fields: {
        project: { key: 'TEST' },
        summary: 'Issue with invalid parent key',
        issuetype: { name: 'Bug' },
        parent: {}, // Missing parent key
      },
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(invalidIssueData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(response.body).toHaveProperty('message', 'Invalid request body: parent key is required if parent field is provided.');
  });


  // Test for POST /rest/api/2/issue simulating a controller failure
  it('should return 500 when createIssue controller function fails', async () => {
    // Mock the createIssue function to throw an error
    // Since createIssue is not an async function that returns a Promise,
    // we mock it to throw synchronously using mockImplementationOnce.
    // Add explicit arguments to match the function signature more closely, though not strictly necessary for a throwing mock.
    jest.mocked(createIssue).mockImplementationOnce((req: any, res: any) => {
      throw new Error('Simulated creation failure');
    });

    // Define a valid request body, as validation should pass and the controller should be called
    const issueData = {
      fields: {
        project: {
          key: 'TEST'
        },
        summary: 'Issue to trigger failure',
        issuetype: {
          name: 'Bug'
        },
      },
    };

    // Send a POST request to the issue creation endpoint
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(issueData)
      .set('Accept', 'application/json');


    // Assert that the response status code is 500 (Internal Server Error)
    expect(response.status).toBe(500);

    // Verify that the createIssue controller function was called
    expect(createIssue).toHaveBeenCalledTimes(1);

    // Optional: Assert the response body structure if the server sends an error message
    // For a 500 error, a generic message is often sent.
    expect(response.body).toHaveProperty('message');
  });


  // Add more tests for other issue-related routes or scenarios as needed
  // e.g., GET /rest/api/2/issue/{issueIdOrKey}, PUT, DELETE, etc.
});
