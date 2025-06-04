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
  it('should return 200 and success message for valid input', async () => {
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send({ title: 'Test Issue', description: 'This is a test issue' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Issue created successfully');
  });

  it('should return 400 for missing title', async () => {
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send({ description: 'This is a test issue' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid input: title and description are required and must be non-empty strings.');
  });

  it('should return 400 for empty title', async () => {
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send({ title: '', description: 'This is a test issue' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid input: title and description are required and must be non-empty strings.');
  });

  it('should return 400 for missing description', async () => {
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send({ title: 'Test Issue' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid input: title and description are required and must be non-empty strings.');
  });

  it('should return 400 for empty description', async () => {
    const res = await request(app)
      .post('/rest/api/2/issue')
      .send({ title: 'Test Issue', description: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid input: title and description are required and must be non-empty strings.');
  });
});
