import request from 'supertest';
import app from './app';

describe('App', () => {
  it('responds with "Hello, world!" for GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, world!');
  });
});
