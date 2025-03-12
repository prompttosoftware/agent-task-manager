// tests/issueRoutes.test.ts
import request from 'supertest';
import app from '../src/app'; // Assuming your app is exported from app.ts

describe('Issue Routes - Label Requirement', () => {
  it('should return 400 if creating an issue without a label', async () => {
    const response = await request(app)
      .post('/issues') // Assuming your issue creation endpoint is /issues
      .send({ // Example issue data.  Adapt to your actual model
        summary: 'Test Issue without Label',
        description: 'This issue should fail because no label is provided',
        // No label field provided
      });

    expect(response.status).toBe(400); // Assuming 400 for bad request/validation error
    // Add specific assertions about the error message if needed
  });

  it('should create an issue successfully if a label is provided', async () => {
    const response = await request(app)
      .post('/issues') // Assuming your issue creation endpoint is /issues
      .send({ // Example issue data.  Adapt to your actual model
        summary: 'Test Issue with Label',
        description: 'This issue should be created successfully.',
        label: 'feature' // Provide a valid label
      });

    expect(response.status).toBe(201); // Assuming 201 for successful creation
    // Add specific assertions about the response body if needed
    expect(response.body).toHaveProperty('id'); // Assuming the response contains an id
  });
});
