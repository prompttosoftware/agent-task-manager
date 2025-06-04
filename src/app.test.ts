import request from 'supertest';
import app from './app'; // Assuming your Express app instance is exported from src/app.ts

describe('GET /', () => {
  it('should respond with a 200 status code', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});
