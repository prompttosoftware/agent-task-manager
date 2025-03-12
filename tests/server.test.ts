// tests/server.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Server', () => {
  it('should start without errors', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
  });
});
