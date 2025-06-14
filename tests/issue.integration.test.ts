import request from 'supertest';
import { app } from '../src/app';

import * as fs from 'fs';
import * as path from 'path';
// import { UploadedFile } from '../middleware/upload.config'; // No longer needed.

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
    const filePath = path.resolve(__dirname, './uploads_test/test.pdf');
    const fileStream = fs.createReadStream(filePath);

    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .set('Content-Type', 'multipart/form-data').attach('file', filePath);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Expect an array in the response body
    expect(response.body.length).toBeGreaterThan(0); // Expect at least one attachment metadata
    expect(response.body[0]).toHaveProperty('filename'); //Expect the first element to have filename property
  });

  it('should return 200 OK with an array of attachment metadata on successful upload', async () => {
    const smallFileBuffer = Buffer.alloc(1024, 'a'); // 1KB
    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .set('Content-Type', 'multipart/form-data')
      .attach('file', smallFileBuffer, 'test_file.txt');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);

    const attachment = response.body[0];
    expect(attachment.id).toBeDefined();
    expect(attachment.issue.id).toBeDefined();
    expect(attachment.filename).toBe('test_file.txt');
    expect(attachment.storedFilename).toBeDefined();
    expect(attachment.mimetype).toBe('text/plain');
    expect(attachment.size).toBe(1024);
  });

  it('should return 400 Bad Request when no files are attached', async () => {
    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .set('Content-Type', 'multipart/form-data')
      .send();
  
    expect(response.status).toBe(400);
  });

  describe('GET /rest/api/2/search', () => {
    it('should return 200 OK and a list of all issues with a correct total count when no query parameters are provided', async () => {
      const response = await request(app).get('/rest/api/2/search');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('issues');
      expect(Array.isArray(response.body.issues)).toBe(true);
      // You might want to add more specific checks here, like verifying the total count matches the number of issues returned,
      // and that the number matches the actual number of issues in the database.
    });

    it('should return a 200 OK and a list of issues matching the provided status ID', async () => {
      // Assuming status ID '1' exists in your seed data. Adjust accordingly.
      const response = await request(app).get('/rest/api/2/search?status=1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('issues');
      expect(Array.isArray(response.body.issues)).toBe(true);
      response.body.issues.forEach((issue: any) => {
        expect(issue.statusId).toBe(1);
      });
    });

    it('should return a 200 OK and a list of issues matching the provided issue type ID', async () => {
      // Assuming issue type ID '1' exists in your seed data. Adjust accordingly.
      const response = await request(app).get('/rest/api/2/search?issuetype=1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('issues');
      expect(Array.isArray(response.body.issues)).toBe(true);
      response.body.issues.forEach((issue: any) => {
        expect(issue.issueTypeId).toBe(1);
      });
    });

    it('should return a 200 OK and a list of issues matching the provided assignee user key', async () => {
      // Assuming assignee user key 'user-1' exists in your seed data. Adjust accordingly.
      const response = await request(app).get('/rest/api/2/search?assignee=user-1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('issues');
      expect(Array.isArray(response.body.issues)).toBe(true);
      response.body.issues.forEach((issue: any) => {
        expect(issue.assignee.userKey).toBe('user-1');
      });
    });

    it('should return a 200 OK and a correctly filtered list of issues that satisfy all criteria when multiple parameters are provided', async () => {
      // Assuming status ID '2', issue type ID '1', and assignee 'user-1' exists in your seed data. Adjust accordingly.
      const response = await request(app).get('/rest/api/2/search?status=2&issuetype=1&assignee=user-1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('issues');
      expect(Array.isArray(response.body.issues)).toBe(true);
      response.body.issues.forEach((issue: any) => {
        expect(issue.statusId).toBe(2);
        expect(issue.issueTypeId).toBe(1);
        expect(issue.assignee.userKey).toBe('user-1');
      });
    });

    it('should return the JSON response in the correct format', async () => {
      const response = await request(app).get('/rest/api/2/search');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
      expect(response.body).toHaveProperty('total');
      expect(typeof response.body.total).toBe('number');
      expect(response.body).toHaveProperty('issues');
      expect(Array.isArray(response.body.issues)).toBe(true);
    });
  });

  it('should return 200 OK with an empty links array when GET /issue/{issueKey} is called for an issue that has no links', async () => {
    // Create an issue
    const createResponse = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Issue with no links',
          description: 'Issue to test no links',
          reporterKey: 'user-1',
          assigneeKey: 'user-1',
          issuetype: { id: '1' }
        }
      });

    expect(createResponse.status).toBe(201);
    const issueKey = createResponse.body.key;

    // Get the issue
    const getResponse = await request(app)
      .get(`/rest/api/2/issue/${issueKey}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toBeDefined();
    expect(getResponse.body.data.links).toBeDefined();
    expect(Array.isArray(getResponse.body.data.links)).toBe(true);
    expect(getResponse.body.data.links.length).toBe(0);
  });

  it('should return 200 OK with link information when GET /issue/{issueKey} is called for an issue that is the outwardIssue in a link', async () => {
    const outwardIssueKey = 'SEED-2';
    const inwardIssueKey = 'SEED-1';

    const getResponse = await request(app)
      .get(`/rest/api/2/issue/${outwardIssueKey}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toBeDefined();
    expect(getResponse.body.data.links).toBeDefined();
    expect(Array.isArray(getResponse.body.data.links)).toBe(true);
    expect(getResponse.body.data.links.length).toBe(1);

    const link = getResponse.body.data.links[0];
    expect(link.id).toBeDefined();
    expect(link.type).toBeDefined();
    expect(link.inwardIssue).toBeDefined();
    expect(link.inwardIssue.key).toBe(inwardIssueKey);
  });

  it('should return 200 OK with link information when GET /issue/{issueKey} is called for an issue that is the inwardIssue in a link', async () => {
    const inwardIssueKey = 'SEED-1';
    const outwardIssueKey = 'SEED-2';

    const getResponse = await request(app)
      .get(`/rest/api/2/issue/${inwardIssueKey}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toBeDefined();
    expect(getResponse.body.data.links).toBeDefined();
    expect(Array.isArray(getResponse.body.data.links)).toBe(true);
    expect(getResponse.body.data.links.length).toBe(1);

    const link = getResponse.body.data.links[0];
    expect(link.id).toBeDefined();
    expect(link.type).toBeDefined();
    expect(link.outwardIssue).toBeDefined();
    expect(link.outwardIssue.key).toBe(outwardIssueKey);
  });

  describe('GET /issue/{issueKey}/transitions', () => {
    it('should return 200 OK with a transitions array for a valid issue', async () => {
      // First, create an issue
      const createResponse = await request(app)
        .post('/rest/api/2/issue')
        .send({
          fields: {
            summary: 'Issue for Transitions',
            description: 'Issue to test transitions',
            reporterKey: 'user-1',
            assigneeKey: 'user-1',
            issuetype: { id: '1' }
          }
        });

      expect(createResponse.status).toBe(201);
      const issueKey = createResponse.body.key;

      const getResponse = await request(app)
        .get(`/rest/api/2/issue/${issueKey}/transitions`);

      expect(getResponse.status).toBe(200);
      expect(Array.isArray(getResponse.body.transitions)).toBe(true);
    });

    it('should return 404 Not Found for a non-existent issue', async () => {
      const getResponse = await request(app)
        .get('/rest/api/2/issue/NONEXISTENT-123/transitions');

      expect(getResponse.status).toBe(404);
      expect(getResponse.body.message).toBe('Issue not found');
    });
  });
});
