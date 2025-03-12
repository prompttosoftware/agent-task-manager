// tests/routes/local_file_storage.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts
import fs from 'fs';
import path from 'path';

describe('Local File Storage Route', () => {
  it('should upload a file', async () => {
    const filePath = path.join(__dirname, '..', '..', 'test_files', 'test.txt');
    const fileContent = 'This is a test file.';

    // Ensure test_files directory exists
    const testFilesDir = path.join(__dirname, '..', '..', 'test_files');
    if (!fs.existsSync(testFilesDir)) {
        fs.mkdirSync(testFilesDir);
    }
    fs.writeFileSync(filePath, fileContent);

    const response = await request(app)
      .post('/api/local-file-storage/upload')
      .attach('file', filePath)
      .expect(200);

    expect(response.body).toHaveProperty('filename');
    const filename = response.body.filename;

    // Clean up the created file
    fs.unlinkSync(filePath);
  });

  it('should download a file', async () => {
    const filePath = path.join(__dirname, '..', '..', 'test_files', 'test.txt');
    const fileContent = 'This is a test file for download.';
    const filename = 'download_test.txt';

    // Ensure test_files directory exists
    const testFilesDir = path.join(__dirname, '..', '..', 'test_files');
    if (!fs.existsSync(testFilesDir)) {
        fs.mkdirSync(testFilesDir);
    }
    fs.writeFileSync(filePath, fileContent);

    // Mock the file upload by manually creating the file
    fs.writeFileSync(path.join(__dirname, '..', '..', 'test_files', filename), fileContent);

    const response = await request(app)
      .get(`/api/local-file-storage/download/${filename}`)
      .expect(200);

    expect(response.text).toBe(fileContent);

    // Clean up the created file
    fs.unlinkSync(filePath);
    fs.unlinkSync(path.join(__dirname, '..', '..', 'test_files', filename));
  });

  it('should handle file not found on download', async () => {
    const response = await request(app)
      .get('/api/local-file-storage/download/nonexistent.txt')
      .expect(404);

    expect(response.body).toEqual({ message: 'File not found' });
  });

  it('should return 400 if no file is provided for upload', async () => {
      const response = await request(app)
          .post('/api/local-file-storage/upload')
          .expect(400);

      expect(response.body).toEqual({ message: 'No file provided' });
  });

});
