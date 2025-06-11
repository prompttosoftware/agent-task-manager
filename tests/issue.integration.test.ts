import request from 'supertest';
import app from '../src/app';

describe('Issue API Integration Tests', () => {
  it('should create a new issue', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({
        title: 'Integration Test Issue',
        description: 'Integration Test Description',
        priority: 'HIGH',
        statusId: 1
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Issue created');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.title).toBe('Integration Test Issue');
  });

  it('should get an existing issue', async () => {
    // First, create an issue
    const createResponse = await request(app)
      .post('/rest/api/2/issue')
      .send({
        title: 'Issue to Get',
        description: 'Description for the issue to get',
        priority: 'MEDIUM',
        statusId: 1
      });

    expect(createResponse.status).toBe(201);
    const issueKey = createResponse.body.data.issueKey;

    // Then, get the issue
    const getResponse = await request(app)
      .get(`/rest/api/2/issue/${issueKey}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toBeDefined();
    expect(getResponse.body.data.issueKey).toBe(issueKey);
    expect(getResponse.body.data.title).toBe('Issue to Get');
  });

  it('should delete an existing issue', async () => {
    // First, create an issue
    const createResponse = await request(app)
      .post('/rest/api/2/issue')
      .send({
        title: 'Issue to Delete',
        description: 'Description for the issue to delete',
        priority: 'LOW',
        statusId: 1
      });

    expect(createResponse.status).toBe(201);
    const issueKey = createResponse.body.data.issueKey;

    // Then, delete the issue
    const deleteResponse = await request(app)
      .delete(`/rest/api/2/issue/${issueKey}`);

    expect(deleteResponse.status).toBe(204);

    // Verify that the issue is deleted
    const getResponse = await request(app)
      .get(`/rest/api/2/issue/${issueKey}`);
    expect(getResponse.status).toBe(404);
  });

  it('should return 404 when getting a non-existent issue', async () => {
    const getResponse = await request(app)
      .get('/rest/api/2/issue/NONEXISTENT-123');

    expect(getResponse.status).toBe(404);
  });

  it('should return 404 when deleting a non-existent issue', async () => {
    const deleteResponse = await request(app)
      .delete('/rest/api/2/issue/NONEXISTENT-123');

    expect(deleteResponse.status).toBe(404);
  });
});
