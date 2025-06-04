import request from 'supertest';
import app from './app';

describe('GET /', () => {
  it('should return "Hello, world!" and status 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Hello, world!');
  });
});

describe('POST /rest/api/2/issue', () => {
  it('should return 200 and success message', async () => {
    const res = await request(app).post('/rest/api/2/issue');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Issue created successfully');
  });
});
