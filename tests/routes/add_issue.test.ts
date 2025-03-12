// tests/routes/add_issue.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('POST /api/issue', () => {
  it('should return 400 if label is missing', async () => {
    const response = await request(app)
      .post('/api/issue')
      .send({ summary: 'Test Issue', description: 'This is a test issue.' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Label is required.');
  });

  it('should create an issue if label is provided', async () => {
    const response = await request(app)
      .post('/api/issue')
      .send({ summary: 'Test Issue with Label', description: 'This is a test issue with a label.', label: 'test' });

    expect(response.statusCode).toBe(201);
    expect(response.body.summary).toBe('Test Issue with Label');
  });
});