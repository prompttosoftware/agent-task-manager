import request from 'supertest';
import app from './app';

describe('App', () => {
  it('should return 200 OK for the root path', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Agent Task Manager API');
  });

  it('should return 201 and a success message for POST /rest/api/2/issue', async () => {
    const sampleIssuePayload = {
      fields: {
        project: {
          key: 'TEST'
        },
        summary: 'Test issue summary',
        description: 'This is a test issue.',
        issuetype: {
          name: 'Bug'
        }
      }
    };

    const response = await request(app)
      .post('/rest/api/2/issue')
      .send(sampleIssuePayload)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Issue created successfully');
  });
});
