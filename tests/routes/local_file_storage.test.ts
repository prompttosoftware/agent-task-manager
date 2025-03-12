// tests/routes/local_file_storage.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts
import fs from 'fs';
import path from 'path';

describe('Local File Storage Route', () => {
  const testFilePath = path.join(__dirname, '..', 'test_attachment.txt');
  const testFileContent = 'This is a test file.';

  beforeAll(() => {
    // Create a test file
    fs.writeFileSync(testFilePath, testFileContent);
  });

  afterAll(() => {
    // Clean up test files
    fs.unlinkSync(testFilePath);
  });

  it('should upload a file', async () => {
    const response = await request(app)
      .post('/api/local-files/upload') // Adjust the route as needed
      .attach('file', testFilePath);

    expect(response.status).toBe(200); // Assuming a 200 OK for successful upload
    expect(response.body).toHaveProperty('filename'); // Assuming filename is returned
  });

  it('should download a file', async () => {
    // First, upload a file (assuming upload works)
    const uploadResponse = await request(app)
      .post('/api/local-files/upload')
      .attach('file', testFilePath);

    const filename = uploadResponse.body.filename;

    const downloadResponse = await request(app)
      .get(`/api/local-files/download/${filename}`); // Adjust the route as needed

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.text).toBe(testFileContent);
  });

  it('should handle file not found during download', async () => {
    const response = await request(app)
      .get('/api/local-files/download/nonexistent_file.txt'); // Adjust the route as needed

    expect(response.status).toBe(404); // Assuming 404 Not Found for a missing file
  });
});