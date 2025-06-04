import request from 'supertest';
import app from './app'; // Assuming app.ts exports the server instance or Express app

describe('GET /', () => {
  it('should respond with 200', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});
