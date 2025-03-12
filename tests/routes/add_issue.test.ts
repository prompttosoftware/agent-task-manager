// tests/routes/add_issue.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Add Issue Route', () => {
  it('should return a 201 status code on successful issue creation', async () => {
    const response = await request(app).post('/api/issues').send({ summary: 'Test Issue', description: 'This is a test issue' });
    expect(response.statusCode).toBe(201);
  });

  it('should return the created issue details', async () => {
    const response = await request(app).post('/api/issues').send({ summary: 'Test Issue', description: 'This is a test issue' });
    expect(response.body).toHaveProperty('summary', 'Test Issue');
  });
});