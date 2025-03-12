// tests/routes/add_issue.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from app.ts

describe('POST /issue', () => {
  it('should create a new issue with valid data', async () => {
    const response = await request(app)
      .post('/issue') // Assuming your route is /issue
      .send({
        summary: 'Test Issue',
        description: 'This is a test issue',
        // Add any other required fields here
      });

    expect(response.statusCode).toBe(201); // Or whatever status code your route returns on success
    expect(response.body).toHaveProperty('id'); // Assuming your route returns the issue ID
    // Add more assertions to validate the response body as needed
  });

  it('should return an error if required fields are missing', async () => {
    const response = await request(app)
      .post('/issue')
      .send({ // Missing summary
        description: 'This is a test issue'
      });

    expect(response.statusCode).toBe(400); // Or the appropriate error status code
    expect(response.body).toHaveProperty('error'); // Check for an error message
    // Add more assertions to validate the error response
  });

  // Add more tests for different error scenarios, data types, etc.
});