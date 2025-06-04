import request from 'supertest';
import app from './app';

describe('App', () => {
  it('should return 200 OK for the root path', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello, world!');
  });
});
