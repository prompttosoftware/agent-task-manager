// tests/routes/get_issue_create_metadata.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Get Issue Create Metadata Route', () => {
  it('should return a 200 status code', async () => {
    const response = await request(app).get('/api/issues/metadata');
    expect(response.statusCode).toBe(200);
  });

  it('should return metadata for issue creation', async () => {
    const response = await request(app).get('/api/issues/metadata');
    expect(response.body).toHaveProperty('projects');
  });
});