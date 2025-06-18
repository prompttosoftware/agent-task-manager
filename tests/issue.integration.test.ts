import request from 'supertest';
import { app } from '../src/app';

import * as fs from 'fs';
import * as path from 'path';
import { attachmentService } from '../src/services/attachment.service';
// import { UploadedFile } from '../middleware/upload.config'; // No longer needed.

import { Issue } from '../src/db/entities/issue.entity';
import { Transition } from '../src/db/entities/transition.entity';
import { AppDataSource } from '../src/data-source';

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
          issuetype: { name: 'Task' }
        }
      });

    expect(createResponse.status).toBe(201);
    issueKey = createResponse.body.key;
    console.log("Issue key in beforeAll:", issueKey);

    // Clean up attachments before running tests
    await attachmentService.deleteAttachmentsByIssueKey(issueKey);
  });

  afterAll(async () => {
    // Delete the issue created in beforeAll to clean up attachments and database entries
    if (issueKey) {
      const deleteResponse = await request(app)
        .delete(`/rest/api/2/issue/${issueKey}`)
        .send();

      expect(deleteResponse.status).toBe(204);
    }
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
          issuetype: { name: 'Task' }
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
          issuetype: { name: 'Task' }
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
          issuetype: { name: 'Task' }
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
    expect(response.body.message).toBe("File size exceeds the limit of 10MB.");
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

  it('should return 200 OK with an array of attachment metadata on successful upload and verify database and file system', async () => {
    const smallFileBuffer = Buffer.alloc(1024, 'a'); // 1KB
    const filename = 'small_file.txt';
    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .set('Content-Type', 'multipart/form-data')
      .attach('file', smallFileBuffer, filename);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);

    const attachmentMetadata = response.body[0];
    expect(attachmentMetadata).toHaveProperty('filename', filename);
    expect(attachmentMetadata).toHaveProperty('mimetype');
    expect(attachmentMetadata).toHaveProperty('size', smallFileBuffer.length);

    // Verify database entry
    const attachments = await attachmentService.getAttachmentsByIssueKey(issueKey);
    expect(attachments).toBeDefined();
    expect(attachments.length).toBeGreaterThan(0);

    const attachment = attachments.find(a => a.filename === filename);
    expect(attachment).toBeDefined();
    expect(attachment?.filename).toBe(filename);
    expect(attachment?.issue.issueKey).toBe(issueKey);

    // Verify file system
    const filePath = path.join(process.cwd(), 'uploads', attachment!.storedFilename);
    // Poll for the file to exist, with a timeout
    const timeout = 2000; // 2 seconds
    const interval = 50;  // Check every 50ms
    let exists = false;
    let startTime = Date.now();

    while (!exists && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));
      exists = fs.existsSync(filePath);
    }

    expect(exists).toBe(true);
  });

  it('Happy Path - Multiple File Upload', async () => {
    const file1Buffer = Buffer.alloc(1024, 'a'); // 1KB
    const file2Buffer = Buffer.alloc(2048, 'b'); // 2KB
    const filename1 = 'file1.txt';
    const filename2 = 'file2.txt';

    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .set('Content-Type', 'multipart/form-data')
      .attach('file', file1Buffer, filename1)
      .attach('file', file2Buffer, filename2);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);

    const attachmentMetadata1 = response.body.find((item: any) => item.filename === filename1);
    const attachmentMetadata2 = response.body.find((item: any) => item.filename === filename2);

    expect(attachmentMetadata1).toBeDefined();
    expect(attachmentMetadata2).toBeDefined();

    expect(attachmentMetadata1).toHaveProperty('filename', filename1);
    expect(attachmentMetadata1).toHaveProperty('mimetype');
    expect(attachmentMetadata1).toHaveProperty('size', file1Buffer.length);

    expect(attachmentMetadata2).toHaveProperty('filename', filename2);
    expect(attachmentMetadata2).toHaveProperty('mimetype');
    expect(attachmentMetadata2).toHaveProperty('size', file2Buffer.length);

    // Verify database entries
    const attachments = await attachmentService.getAttachmentsByIssueKey(issueKey);
    expect(attachments).toBeDefined();
    expect(attachments.length).toBeGreaterThanOrEqual(2);

    const attachment1 = attachments.find(a => a.filename === filename1);
    const attachment2 = attachments.find(a => a.filename === filename2);

    expect(attachment1).toBeDefined();
    expect(attachment2).toBeDefined();

    expect(attachment1?.filename).toBe(filename1);
    expect(attachment1?.issue.issueKey).toBe(issueKey);

    expect(attachment2?.filename).toBe(filename2);
    expect(attachment2?.issue.issueKey).toBe(issueKey);

    // Verify file system
    const filePath1 = path.join(process.cwd(), 'uploads', attachment1!.storedFilename);
    const filePath2 = path.join(process.cwd(), 'uploads', attachment2!.storedFilename);

    // Poll for the file to exist, with a timeout
    const timeout = 2000; // 2 seconds
    const interval = 50;  // Check every 50ms
    let exists1 = false;
    let exists2 = false;
    let startTime = Date.now();

    while ((!exists1 || !exists2) && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));
      exists1 = fs.existsSync(filePath1);
      exists2 = fs.existsSync(filePath2);
    }

    expect(exists1).toBe(true);
    expect(exists2).toBe(true);
  });

  it('should return 400 Bad Request when no files are provided', async () => {
    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .set('Content-Type', 'multipart/form-data');

    expect(response.status).toBe(400);
  });
});

describe('Issue Transitions API Integration Tests', () => {
let issueKeyForTransitions: string;
let transitionId: number;

beforeAll(async () => {
  // Create an issue specifically for transitions
  const createResponse = await request(app)
    .post('/rest/api/2/issue')
    .send({
      fields: {
        summary: 'Issue for Transitions',
        description: 'Issue to test transitions',
        reporterKey: 'user-1',
        assigneeKey: 'user-1',
        issuetype: { name: 'Task' }
      }
    });

  expect(createResponse.status).toBe(201);
  issueKeyForTransitions = createResponse.body.key;

  // Fetch a valid status ID for the created issue, other than the initial status.
  const initialStatusId = 11;
  const availableStatuses = Object.keys(require('../src/config/static-data').IssueStatusMap)
    .filter(statusId => parseInt(statusId) !== initialStatusId);

  expect(availableStatuses.length).toBeGreaterThan(0);
  transitionId = parseInt(availableStatuses[0]);
});

afterAll(async () => {
  // Clean up: Delete the issue created for transitions
  if (issueKeyForTransitions) {
    const deleteResponse = await request(app)
      .delete(`/rest/api/2/issue/${issueKeyForTransitions}`)
      .send();

    expect(deleteResponse.status).toBe(204);
  }
});

it('should update issue status on successful transition', async () => {
  // Fetch available transitions for the issue
  const getTransitionsResponse = await request(app).get(`/rest/api/2/issue/${issueKeyForTransitions}/transitions`);
  expect(getTransitionsResponse.status).toBe(200);
  const availableTransitions = getTransitionsResponse.body.transitions;

  // Ensure there are available transitions
  expect(availableTransitions.length).toBeGreaterThan(0);

  // Select the ID of the first available transition
  const localTransitionId = availableTransitions[0].id;

  const transitionResponse = await request(app)
    .post(`/rest/api/2/issue/${issueKeyForTransitions}/transitions`)
    .send({
      transition: {
        id: localTransitionId
      }
    });

  expect(transitionResponse.status).toBe(204);

  // Wait for a short period to allow the database to update
  await new Promise(resolve => setTimeout(resolve, 100));

  // Verify the statusId has been updated in the database
  const issue = await AppDataSource.getRepository(Issue).findOne({ where: { issueKey: issueKeyForTransitions } });
  expect(issue).toBeDefined();
  expect(issue?.statusId).toBe(parseInt(localTransitionId)); // Ensure statusId is updated
});

it('should return 404 Not Found for a non-existent issueKey', async () => {
  const transitionResponse = await request(app)
    .post(`/rest/api/2/issue/NONEXISTENT-123/transitions`)
    .send({
      transition: {
        id: '11'
      }
    });

  expect(transitionResponse.status).toBe(404);
});

it('should return 400 Bad Request for an invalid transition.id', async () => {
  const transitionResponse = await request(app)
    .post(`/rest/api/2/issue/${issueKeyForTransitions}/transitions`)
    .send({
      transition: {
        id: 99999 // Non-existent transition ID
      }
    });

  expect(transitionResponse.status).toBe(400);
});

it('should return 400 Bad Request for a malformed body', async () => {
  const transitionResponse = await request(app)
    .post(`/rest/api/2/issue/${issueKeyForTransitions}/transitions`)
    .send({
      invalidField: 'invalidValue'
    });

  expect(transitionResponse.status).toBe(400);
});
});
