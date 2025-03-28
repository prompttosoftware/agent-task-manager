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

  it('returns an error if invalid issueType is provided', async () => {
    const response = await request(app)
      .post('/issues')
      .send({ summary: 'Test Summary', issueType: 'InvalidType' });
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

describe('GET /issues/:id', () => {
  it('responds with an issue when it exists', async () => {
    // First, create an issue to test with
    const createResponse = await request(app)
      .post('/issues')
      .send({ summary: 'Get by ID Test', issueType: 'Task' });

    expect(createResponse.statusCode).toBe(201);
    const issueId = createResponse.body.id;

    const getResponse = await request(app).get(`/issues/${issueId}`);

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toHaveProperty('id');
    expect(getResponse.body.summary).toBe('Get by ID Test');
    expect(getResponse.body.issueType).toBe('Task');
  });

  it('returns 404 when the issue does not exist', async () => {
    const response = await request(app).get('/issues/nonexistent-id');
    expect(response.statusCode).toBe(404);
  });
});

describe('PUT /issues/:id', () => {
  it('updates an existing issue', async () => {
    // Create an issue to update
    const createResponse = await request(app)
      .post('/issues')
      .send({ summary: 'Update Test', issueType: 'Task' });
    expect(createResponse.statusCode).toBe(201);
    const issueId = createResponse.body.id;

    // Update the issue
    const updateResponse = await request(app)
      .put(`/issues/${issueId}`)
      .send({ summary: 'Updated Summary' });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.summary).toBe('Updated Summary');
  });

  it('returns 404 if the issue does not exist', async () => {
    const response = await request(app)
      .put('/issues/nonexistent-id')
      .send({ summary: 'Updated Summary' });
    expect(response.statusCode).toBe(404);
  });

  it('returns 400 if summary is missing', async () => {
    const createResponse = await request(app)
        .post('/issues')
        .send({ summary: 'Update Test', issueType: 'Task' });
    expect(createResponse.statusCode).toBe(201);
    const issueId = createResponse.body.id;

    const response = await request(app)
        .put(`/issues/${issueId}`)
        .send({});
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /issue', () => {
  it('responds with issues matching the search query', async () => {
    // Create an issue to search for
    const createResponse = await request(app)
      .post('/issues')
      .send({ summary: 'Search Test', issueType: 'Task' });
    expect(createResponse.statusCode).toBe(201);
    const issueId = createResponse.body.id;

    // Search for the issue
    const searchResponse = await request(app).get('/issue?query=Search');

    expect(searchResponse.statusCode).toBe(200);
    expect(searchResponse.body).toBeInstanceOf(Array);
    expect(searchResponse.body.some((issue: any) => issue.summary === 'Search Test')).toBe(true);
  });

  it('returns 400 if the query parameter is missing', async () => {
    const response = await request(app).get('/issue');
    expect(response.statusCode).toBe(400);
  });
  it('returns 200 with empty array if no issues match search query', async () => {
    const response = await request(app).get('/issue?query=nonexistent');
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
  });
});

describe('POST /issues/:id/links', () => {
  it('creates a link between issues', async () => {
    // Create two issues
    const createResponse1 = await request(app)
      .post('/issues')
      .send({ summary: 'Issue 1', issueType: 'Task' });
    expect(createResponse1.statusCode).toBe(201);
    const issue1Id = createResponse1.body.id;

    const createResponse2 = await request(app)
      .post('/issues')
      .send({ summary: 'Issue 2', issueType: 'Task' });
    expect(createResponse2.statusCode).toBe(201);
    const issue2Id = createResponse2.body.id;

    // Create a link from issue1 to issue2
    const linkResponse = await request(app)
      .post(`/issues/${issue1Id}/links`)
      .send({ type: 'relates to', issueKey: issue2Id });
    expect(linkResponse.statusCode).toBe(201);
    expect(linkResponse.body.type).toBe('relates to');
    expect(linkResponse.body.issueKey).toBe(issue2Id);
  });

  it('returns 404 if the issue does not exist', async () => {
    const response = await request(app)
      .post('/issues/nonexistent-id/links')
      .send({ type: 'relates to', issueKey: 'some-other-id' });
    expect(response.statusCode).toBe(404);
  });

  it('returns 400 if the issueKey is invalid', async () => {
    // Create an issue to test with
    const createResponse = await request(app)
      .post('/issues')
      .send({ summary: 'Issue to link from', issueType: 'Task' });
    expect(createResponse.statusCode).toBe(201);
    const issue1Id = createResponse.body.id;

    const linkResponse = await request(app)
      .post(`/issues/${issue1Id}/links`)
      .send({ type: 'relates to', issueKey: 'nonexistent-id' });
    expect(linkResponse.statusCode).toBe(400);
  });

  it('returns 400 if required fields are missing', async () => {
    // Create an issue to test with
    const createResponse = await request(app)
      .post('/issues')
      .send({ summary: 'Issue to link from', issueType: 'Task' });
    expect(createResponse.statusCode).toBe(201);
    const issue1Id = createResponse.body.id;

    const linkResponse = await request(app)
      .post(`/issues/${issue1Id}/links`)
      .send({ issueKey: 'some-other-id' });
    expect(linkResponse.statusCode).toBe(400);
  });
});

describe('GET /issues/:id/links', () => {
  it('retrieves links for an issue', async () => {
    // Create two issues
    const createResponse1 = await request(app)
      .post('/issues')
      .send({ summary: 'Issue 1', issueType: 'Task' });
    expect(createResponse1.statusCode).toBe(201);
    const issue1Id = createResponse1.body.id;

    const createResponse2 = await request(app)
      .post('/issues')
      .send({ summary: 'Issue 2', issueType: 'Task' });
    expect(createResponse2.statusCode).toBe(201);
    const issue2Id = createResponse2.body.id;

    // Create a link from issue1 to issue2
    await request(app)
      .post(`/issues/${issue1Id}/links`)
      .send({ type: 'relates to', issueKey: issue2Id });

    // Get the links for issue1
    const getLinksResponse = await request(app).get(`/issues/${issue1Id}/links`);
    expect(getLinksResponse.statusCode).toBe(200);
    expect(getLinksResponse.body).toBeInstanceOf(Array);
    expect(getLinksResponse.body.some((link: any) => link.issueKey === issue2Id)).toBe(true);
  });

  it('returns 404 if the issue does not exist', async () => {
    const getLinksResponse = await request(app).get('/issues/nonexistent-id/links');
    expect(getLinksResponse.statusCode).toBe(404);
  });
});

describe('PUT /issues/:id/links', () => {
  it('updates links for an issue', async () => {
    // Create two issues
    const createResponse1 = await request(app)
      .post('/issues')
      .send({ summary: 'Issue 1', issueType: 'Task' });
    expect(createResponse1.statusCode).toBe(201);
    const issue1Id = createResponse1.body.id;

    const createResponse2 = await request(app)
      .post('/issues')
      .send({ summary: 'Issue 2', issueType: 'Task' });
    expect(createResponse2.statusCode).toBe(201);
    const issue2Id = createResponse2.body.id;

    // Create a link from issue1 to issue2
    await request(app)
      .post(`/issues/${issue1Id}/links`)
      .send({ type: 'relates to', issueKey: issue2Id });

    // Update the links for issue1 to remove the link
    const updateLinksResponse = await request(app)
      .put(`/issues/${issue1Id}/links`)
      .send({ links: [] });
    expect(updateLinksResponse.statusCode).toBe(200);
    expect(updateLinksResponse.body).toEqual([]);
  });

  it('returns 404 if the issue does not exist', async () => {
    const updateLinksResponse = await request(app)
      .put('/issues/nonexistent-id/links')
      .send({ links: [] });
    expect(updateLinksResponse.statusCode).toBe(404);
  });

  it('returns 400 if the links are not an array', async () => {
    // Create an issue to test with
    const createResponse = await request(app)
      .post('/issues')
      .send({ summary: 'Issue to link from', issueType: 'Task' });
    expect(createResponse.statusCode).toBe(201);
    const issue1Id = createResponse.body.id;
    const updateLinksResponse = await request(app)
      .put(`/issues/${issue1Id}/links`)
      .send({ links: {} });
    expect(updateLinksResponse.statusCode).toBe(400);
  });

  it('returns 400 if the link is invalid', async () => {
    // Create an issue to test with
    const createResponse = await request(app)
      .post('/issues')
      .send({ summary: 'Issue to link from', issueType: 'Task' });
    expect(createResponse.statusCode).toBe(201);
    const issue1Id = createResponse.body.id;
    const updateLinksResponse = await request(app)
      .put(`/issues/${issue1Id}/links`)
      .send({ links: [{type: 'relates to'}] });
    expect(updateLinksResponse.statusCode).toBe(400);
  });
});

describe('GET /issue/:issueId', () => {
  it('responds with an issue when it exists', async () => {
    // Create an issue to test with
    const createResponse = await request(app)
      .post('/issues')
      .send({ summary: 'Get by ID Test', issueType: 'Task' });

    expect(createResponse.statusCode).toBe(201);
    const issueId = createResponse.body.id;

    const getResponse = await request(app).get(`/issue/${issueId}`);

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toHaveProperty('id');
    expect(getResponse.body.summary).toBe('Get by ID Test');
    expect(getResponse.body.issueType).toBe('Task');
  });

  it('returns 404 when the issue does not exist', async () => {
    const response = await request(app).get('/issue/nonexistent-id');
    expect(response.statusCode).toBe(404);
  });
});

