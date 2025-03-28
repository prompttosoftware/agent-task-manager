import request from 'supertest';
import app from '../index'; // Assuming your app is exported

describe('GET /issue/createmeta', () => {
  it('responds with JSON data for issue create metadata', async () => {
    const response = await request(app).get('/issue/createmeta');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('issueTypes');
    expect(response.body.issueTypes).toBeInstanceOf(Array);
    // Add more specific assertions to validate the structure of the response
    const issueTypes = response.body.issueTypes;
    issueTypes.forEach(issueType => {
      expect(issueType).toHaveProperty('id');
      expect(issueType).toHaveProperty('name');
      expect(issueType).toHaveProperty('description');
      expect(issueType).toHaveProperty('fields');
    });
  });
});

describe('POST /issues', () => {
  it('creates a new issue with valid data', async () => {
    const response = await request(app)
      .post('/issues')
      .send({ summary: 'Test Summary', issueType: 'Task' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.summary).toBe('Test Summary');
    expect(response.body.issueType).toBe('Task');
  });

  it('returns an error if required fields are missing', async () => {
    const response = await request(app).post('/issues').send({ summary: 'Test Summary' });

    expect(response.statusCode).toBe(400);
  });
});

describe('DELETE /issues/:id', () => {
    it('deletes an existing issue', async () => {
      // First, create an issue to delete
      const createResponse = await request(app)
        .post('/issues')
        .send({ summary: 'Delete Test', issueType: 'Task' });

      expect(createResponse.statusCode).toBe(201);
      const issueId = createResponse.body.id;

      // Then, delete the created issue
      const deleteResponse = await request(app).delete(`/issues/${issueId}`);

      expect(deleteResponse.statusCode).toBe(204);

      // Optionally, verify that the issue is actually deleted.  This would require a GET call to the /issues/:id endpoint.
      const getResponse = await request(app).get(`/issues/${issueId}`);
      expect(getResponse.statusCode).toBe(404);
    });

    it('returns 404 if issue does not exist', async () => {
      const response = await request(app).delete('/issues/nonexistent-id');
      expect(response.statusCode).toBe(404);
    });
  });