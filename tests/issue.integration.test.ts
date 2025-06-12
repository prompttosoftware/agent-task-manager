import request from 'supertest';
import app from '../src/app';

import * as fs from 'fs';
import * as path from 'path';

describe('Issue API Integration Tests', () => {
  let issueKey: string;

  beforeAll(async () => {
    // Create the temporary directory for uploads if it doesn't exist
    const tmpDir = path.join(__dirname, '../uploads/tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Create an issue before running attachment tests
    const createResponse = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Issue for Attachments',
          description: 'Issue to attach files to',
          reporterKey: 'user-1',
          assigneeKey: 'user-1',
          issuetype: { id: '1' }
        }
      });

    expect(createResponse.status).toBe(201);
    issueKey = createResponse.body.key;
    console.log("Issue key in beforeAll:", issueKey);
  });

  it('should create a new issue', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Integration Test Issue',
          description: 'Integration Test Description',
          reporterKey: 'user-1', // Assuming 'user-1' exists in your seed data
          assigneeKey: 'user-1', // Assuming 'user-1' exists in your seed data
          issuetype: { id: '1' }
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.key).toBeDefined();
    expect(response.body.self).toBe(`/rest/api/2/issue/${response.body.key}`);
  });

  it('should return 200 OK with issue details when issue is found', async () => {
    // First, create an issue
    const createResponse = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Issue to Get',
          description: 'Description for the issue to get',
          reporterKey: 'user-1',
          assigneeKey: 'user-1',
          issuetype: { id: '1' }
        }
      });

    expect(createResponse.status).toBe(201);
    const issueKey = createResponse.body.key;

    // Then, get the issue
    const getResponse = await request(app)
      .get(`/rest/api/2/issue/${issueKey}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toBeDefined();
    expect(getResponse.body.data.id).toBeDefined();
    expect(getResponse.body.data.issueKey).toBeDefined();
    expect(getResponse.body.data.self).toBeDefined();
    expect(getResponse.body.data.summary).toBe('Issue to Get');
    expect(getResponse.body.data.description).toBe('Description for the issue to get');
  });

  it('should return 404 Not Found when issue is not found', async () => {
    const getResponse = await request(app)
      .get('/rest/api/2/issue/NONEXISTENT-123');

    expect(getResponse.status).toBe(404);
  });

  it('should delete an existing issue', async () => {
    // First, create an issue
    const createResponse = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Issue to Delete',
          description: 'Description for the issue to delete',
          reporterKey: 'user-1', // Assuming 'user-1' exists in your seed data
          assigneeKey: 'user-1', // Assuming 'user-1' exists in your seed data
          issuetype: { id: '1' }
        }
      });

    expect(createResponse.status).toBe(201);
    const issueKey = createResponse.body.key;

    // Then, delete the issue
    const deleteResponse = await request(app)
      .delete(`/rest/api/2/issue/${issueKey}`)
      .send();

    expect(deleteResponse.status).toBe(204);

    // Verify that the issue is deleted
    const getResponse = await request(app)
      .get(`/rest/api/2/issue/${issueKey}`);
    expect(getResponse.status).toBe(404);
  });

  it('should return 404 when deleting a non-existent issue', async () => {
    const deleteResponse = await request(app)
      .delete('/rest/api/2/issue/NONEXISTENT-123');

    expect(deleteResponse.status).toBe(404);
  });

  it('should return 413 Payload Too Large when uploading a file larger than 10MB', async () => {
    const largeFileBuffer = Buffer.alloc(11 * 1024 * 1024, 'a'); // 11MB
    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .set('Content-Type', 'multipart/form-data')
      .attach('file', largeFileBuffer, 'large_file.txt');

    expect(response.status).toBe(413);
    expect(response.body.message).toBe('File size exceeds the limit of 10MB.');
  });

  it('should pass through multer middleware when uploading a valid file', async () => {
    const smallFileBuffer = Buffer.alloc(1024, 'a'); // 1KB
    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .set('Content-Type', 'multipart/form-data')
      .attach('file', smallFileBuffer, 'small_file.txt');

    // Expect a 200 OK, assuming the placeholder controller handles the request
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Attachment upload successful.');
  });
});
