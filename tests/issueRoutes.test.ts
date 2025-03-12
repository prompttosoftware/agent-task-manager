// tests/issueRoutes.test.ts
import request from 'supertest';
import app from '../src/app'; // Assuming you have an app.ts file
import { Issue } from '../src/models/issue';

describe('Issue Routes', () => {
  it('GET /:id - should return an issue', async () => {
    const issueId = '1';
    const res = await request(app).get(`/issues/${issueId}`);

    expect(res.statusCode).toEqual(200);
    //  expect(res.body.id).toEqual(issueId);
    expect(res.body).toMatchObject<Issue>({
       id: expect.any(String),
       boardId: expect.any(String),
       summary: expect.any(String),
       description: expect.any(String),
       status: expect.any(String)
    });
  });

  it('GET /:id - should return 404 if issue not found', async () => {
    const issueId = '99';
    const res = await request(app).get(`/issues/${issueId}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({ message: 'Issue not found' });
  });

  it('GET /board/:boardId - should return issues for a specific board', async () => {
        const boardId = 'board1';
        const res = await request(app).get(`/issues/board/${boardId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.every((issue: Issue) => issue.boardId === boardId)).toBe(true);
    });

    it('POST / - should add a new issue', async () => {
        const newIssue = {
            boardId: 'board2',
            summary: 'New Issue',
            description: 'Description',
            status: 'Open'
        };
        const res = await request(app).post('/issues').send(newIssue);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toMatchObject<Issue>({
            boardId: newIssue.boardId,
            summary: newIssue.summary,
            description: newIssue.description,
            status: newIssue.status,
            id: expect.any(String)  // Expect an ID to be generated
        });
    });

    it('PUT /:id/transition - should transition an issue', async () => {
        const issueId = '1';
        const res = await request(app).put(`/issues/${issueId}/transition`).send({ transitionId: '2' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('In Progress');
    });

    it('DELETE /:id - should delete an issue', async () => {
        const issueId = '1';
        const res = await request(app).delete(`/issues/${issueId}`);
        expect(res.statusCode).toEqual(204);
        // Verify the issue is actually deleted (optional)
        const getRes = await request(app).get(`/issues/${issueId}`);
        expect(getRes.statusCode).toEqual(404);
    });

    it('PUT /:id/assignee - should update the assignee of an issue', async () => {
        const issueId = '2';
        const newAssignee = 'newuser';
        const res = await request(app).put(`/issues/${issueId}/assignee`).send({ assignee: newAssignee });
        expect(res.statusCode).toEqual(200);
        expect(res.body.assignee).toEqual(newAssignee);
    });

    it('GET /metadata/create - should return issue create metadata', async () => {
        const res = await request(app).get('/issues/metadata/create');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('fields');
    });

    it('GET /:id/transitions - should list transitions for an issue', async () => {
        const issueId = '1';
        const res = await request(app).get(`/issues/${issueId}/transitions`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
    });

    it('POST /:id/link - should link two issues (placeholder)', async () => {
        const issueId = '1';
        const res = await request(app).post(`/issues/${issueId}/link`);
        expect(res.statusCode).toEqual(204);
    });

    it('POST /:id/attachment - should add an attachment (placeholder)', async () => {
        const issueId = '1';
        const res = await request(app).post(`/issues/${issueId}/attachment`);
        expect(res.statusCode).toEqual(204);
    });
});