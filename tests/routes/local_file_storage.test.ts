// tests/routes/local_file_storage.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Local File Storage Route', () => {
  it('should return a 200 status code', async () => {
    const response = await request(app).get('/api/files/somefile.txt');
    expect(response.statusCode).toBe(200);
  });

  it('should return the file content', async () => {
    const response = await request(app).get('/api/files/somefile.txt');
    expect(response.text).toBe('File content here'); // Replace with actual expected content if known
  });
});