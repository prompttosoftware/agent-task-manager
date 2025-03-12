// tests/routes/add_attachment.test.ts
import request from 'supertest';
import { app } from '../../src/app'; // Assuming your app is exported from src/app.ts

describe('POST /issue/{issueKey}/attachments', () => {
  it('should return 200 OK for a successful file upload', async () => {
    // Implement a mock for file upload
    const response = await request(app)
      .post('/issue/ATM-123/attachments') // Replace with the correct route
      .attach('file', 'tests/test_attachment.txt') // Use the attachment file
      .expect(200);

    expect(response.body).toBeDefined();
    // Add more assertions based on the expected response
  });

  it('should return 400 Bad Request for missing file', async () => {
    const response = await request(app)
      .post('/issue/ATM-123/attachments') // Replace with the correct route
      .expect(400);

    expect(response.body).toBeDefined();
    // Add assertions for the error message
  });

  it('should return 404 Not Found for an invalid issue key', async () => {
    const response = await request(app)
      .post('/issue/INVALID-123/attachments') // Replace with the correct route
      .attach('file', 'tests/test_attachment.txt')
      .expect(404);

    expect(response.body).toBeDefined();
    // Add assertions for the error message
  });

  // Add more tests for other failure scenarios (e.g., invalid file type, server error)
});