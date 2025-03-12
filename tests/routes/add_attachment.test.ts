// tests/routes/add_attachment.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('POST /api/attachments', () => {
  it('should return 200 and upload the file successfully', async () => {
    const response = await request(app)
      .post('/api/attachments')
      .attach('file', Buffer.from('test file content'), 'test.txt') // Simulating file attachment
      .expect(200);

    expect(response.body).toHaveProperty('message', 'File uploaded successfully');
    // Add more assertions to check the response body, e.g., file metadata
  });

  it('should return 400 if no file is attached', async () => {
    const response = await request(app)
      .post('/api/attachments')
      .expect(400);

    expect(response.body).toHaveProperty('error', 'No file attached');
  });

  it('should return 400 for an invalid file type', async () => {
    const response = await request(app)
      .post('/api/attachments')
      .attach('file', Buffer.from('test file content'), 'test.exe') // Invalid file type
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid file type');
  });
});