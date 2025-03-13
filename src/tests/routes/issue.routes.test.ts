// src/tests/routes/issue.routes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index'; // Assuming you have an app instance
import { InMemoryStorage } from '../../data/inMemoryStorage';
import { DataService } from '../../services/dataService';
import { IssueService } from '../../services/issueService';

const dataService = new DataService(new InMemoryStorage());
const issueService = new IssueService(dataService);

describe('Issue Routes Integration Tests', () => {
  beforeAll(async () => {
    // Seed in-memory data if needed
    await issueService.createIssue({ summary: 'Test Issue', description: 'Test Description', assignee: 'testuser' });
  });

  afterAll(async () => {
    // Clean up in-memory data if needed
    dataService.clear();
  });

  it('GET /api/issues should return a list of issues', async () => {
    const res = await request(app).get('/api/issues');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/issues should create a new issue', async () => {
    const newIssue = {
      summary: 'New Test Issue',
      description: 'New Test Description',
      assignee: 'anotheruser',
    };
    const res = await request(app).post('/api/issues').send(newIssue);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.summary).toBe(newIssue.summary);
  });

  it('GET /api/issues/:id should return a specific issue', async () => {
    const allIssues = await request(app).get('/api/issues');
    const issueId = allIssues.body[0].id;
    const res = await request(app).get(`/api/issues/${issueId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  it('PUT /api/issues/:id should update an issue', async () => {
    const allIssues = await request(app).get('/api/issues');
    const issueId = allIssues.body[0].id;
    const updatedIssue = { summary: 'Updated Test Issue' };
    const res = await request(app).put(`/api/issues/${issueId}`).send(updatedIssue);
    expect(res.statusCode).toBe(200);
    expect(res.body.summary).toBe(updatedIssue.summary);
  });

  it('DELETE /api/issues/:id should delete an issue', async () => {
    const allIssues = await request(app).get('/api/issues');
    const issueId = allIssues.body[0].id;
    const res = await request(app).delete(`/api/issues/${issueId}`);
    expect(res.statusCode).toBe(204);
    // Verify that the issue is actually deleted (optional)
    const getRes = await request(app).get(`/api/issues/${issueId}`);
    expect(getRes.statusCode).toBe(404);
  });
});