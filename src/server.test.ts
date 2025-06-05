import request from 'supertest';
import app from './app'; // Assuming your Express app is exported from app.ts

describe('Server', () => {
  it('should start successfully and respond on the root path', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, world!');
  });
});

describe('Issue API', () => {
  it('should handle issue creation request and return 202 status', async () => {
    const issueData = {
      project: 'TEST',
      summary: 'Test Issue from Supertest',
      issueType: 'Task',
      description: 'This is a test issue created via the API.',
    };

    const response = await request(app)
      .post('/api/issues/rest/api/2/issue')
      .send(issueData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty('message', 'Issue creation request received (processing placeholder).');
  });
});
