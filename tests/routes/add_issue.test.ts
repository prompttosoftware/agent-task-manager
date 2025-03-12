// tests/routes/add_issue.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts

describe('POST /api/issue', () => {
  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/issue')
      .send({  // Missing required fields like 'summary' and 'description'
        // labels: ['bug'] // Assuming labels is a valid field
      });

    expect(response.status).toBe(400);
    // You might want to check the error message as well, e.g.,
    // expect(response.body.message).toBe('Missing required fields');
  });

  it('should return 400 if data types are incorrect', async () => {
    const response = await request(app)
      .post('/api/issue')
      .send({
        summary: 123, // Incorrect data type for summary
        description: true, // Incorrect data type for description
        // Add other fields with incorrect data types as needed
      });

    expect(response.status).toBe(400);
    //expect(response.body.message).toBe('Incorrect data types');
  });

  it('should return 400 if labels are invalid', async () => {
    const response = await request(app)
      .post('/api/issue')
      .send({
        summary: 'Test issue with invalid labels',
        description: 'This is a test',
        labels: [123, 'invalidLabel'] // Invalid label format
      });

    expect(response.status).toBe(400);
    //expect(response.body.message).toBe('Invalid labels');
  });

  // Add more tests for other validation rules, e.g., max length, format, etc.
});