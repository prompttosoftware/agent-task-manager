import request from 'supertest';
import app from './index'; // Assuming your app is exported

describe('GET /issue/createmeta', () => {
  it('responds with JSON data for issue create metadata', async () => {
    const response = await request(app).get('/issue/createmeta');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('issueTypes');
    // Add more specific assertions to validate the structure of the response
  });
});

describe('POST /issue', () => {
  it('creates a new issue with valid data', async () => {
    const response = await request(app)
      .post('/issue')
      .send({ summary: 'Test Summary', description: 'Test Description', issueType: 'Task' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.summary).toBe('Test Summary');
    expect(response.body.description).toBe('Test Description');
    expect(response.body.issueType).toBe('Task');
  });

  it('returns an error if required fields are missing', async () => {
    const response = await request(app).post('/issue').send({ summary: 'Test Summary' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});