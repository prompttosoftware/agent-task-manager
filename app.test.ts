import request from 'supertest';
import app from './src/app';

describe('POST /rest/api/2/issue', () => {
  it('should create a new issue with valid data', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Test issue',
          description: 'This is a test issue description',
          issuetype: { name: 'TASK' },
          status: 'Open',
        },
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('key');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          description: 'This is a test issue description',
          issuetype: { name: 'TASK' },
          status: 'Open',
        },
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for invalid issue type', async () => {
      const response = await request(app)
        .post('/rest/api/2/issue')
        .send({
          fields: {
            summary: 'Test issue',
            issuetype: { name: 'INVALID' },
            status: 'Open',
          },
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

  it('should handle subtasks correctly', async () => {
      const response = await request(app)
        .post('/rest/api/2/issue')
        .send({
          fields: {
            summary: 'Test subtask',
            issuetype: { name: 'SUBT' },
            status: 'Open',
            parentIssueKey: 'PROJ-123',
          },
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('key');
    });

  it('should return 400 for missing parentIssueKey for subtask', async () => {
      const response = await request(app)
        .post('/rest/api/2/issue')
        .send({
          fields: {
            summary: 'Test subtask',
            issuetype: { name: 'SUBT' },
            status: 'Open',
          },
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
});
