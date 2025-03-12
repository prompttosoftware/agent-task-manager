// test/controllers/issue.controller.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase } from '../setup';
import { createIssue } from '../../src/services/issue.service';


describe('Issue Controller - Add Attachment', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should successfully add an attachment to an issue with a valid issue key and attachment', async () => {
    // Create an issue first
    const issue = await createIssue({
      summary: 'Test Issue Attachment',
      description: 'This is a test issue for attachment',
      issueTypeId: 1,
      projectId: 1,
      priorityId: 1,
      statusId: 1
    });
    const issueKey = issue.key;

    const filePath = './test/test_files/test.txt';

    // Mock file upload
    const res = await request(app)
      .post(`/issue/${issueKey}/attachments`)
      .attach('file', filePath)
      .expect(201);

    expect(res.body).toBeDefined();
    expect(res.body.message).toBe('Attachment added successfully');
  });
});
