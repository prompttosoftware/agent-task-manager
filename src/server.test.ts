import request from 'supertest';
import app from './app'; // Assuming your Express app is exported from app.ts

describe('Server', () => {
  it('should start successfully and respond on the root path', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, world!');
  });
});
