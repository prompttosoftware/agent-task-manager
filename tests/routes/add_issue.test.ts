// tests/routes/add_issue.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from src/app.ts or similar

describe('Add Issue Endpoint', () => {
  it('should respond with a 200 status code', async () => {
    const response = await request(app).post('/api/issues'); // Assuming your endpoint is /api/issues
    expect(response.statusCode).toBe(200);
  });
});