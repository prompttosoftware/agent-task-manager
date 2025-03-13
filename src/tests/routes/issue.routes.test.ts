// src/tests/routes/issue.routes.test.ts
import request from 'supertest';
import app from '../../index';
import * as dataService from '../../src/data/dataService';

describe('Issue Routes', () => {
  beforeEach(() => {
    // Clear in-memory storage before each test
    dataService.issues.length = 0;
  });

  it('should create a new issue', async () => {
    const newIssue = {
      key: 'TASK-123',
      fields: {
        summary: 'Test issue',
        issuetype: { name: 'Task' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };

    const res = await request(app).post('/').send(newIssue);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('key', 'TASK-123');
    expect(dataService.issues.length).toEqual(1);
  });

  it('should get an issue by key', async () => {
    const issue = {
      key: 'TASK-456',
      fields: {
        summary: 'Test issue',
        issuetype: { name: 'Task' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };
    dataService.issues.push(issue);

    const res = await request(app).get('/TASK-456');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('key', 'TASK-456');
  });

  it('should return 404 if issue not found', async () => {
    const res = await request(app).get('/NON-EXISTING-KEY');
    expect(res.statusCode).toEqual(404);
  });

  it('should get all issues', async () => {
    const issue1 = {
      key: 'TASK-789',
      fields: {
        summary: 'Test issue 1',
        issuetype: { name: 'Task' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };
    const issue2 = {
      key: 'BUG-123',
      fields: {
        summary: 'Test issue 2',
        issuetype: { name: 'Bug' },
        labels: [],
        status: { name: 'In Progress', id: '3' },
      },
    };
    dataService.issues.push(issue1, issue2);

    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(2);
  });

  it('should update an issue', async () => {
    const issue = {
      key: 'TASK-111',
      fields: {
        summary: 'Original summary',
        issuetype: { name: 'Task' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };
    dataService.issues.push(issue);

    const updatedFields = {
      fields: {
        summary: 'Updated summary',
      },
    };

    const res = await request(app).put('/TASK-111').send(updatedFields);
    expect(res.statusCode).toEqual(200);
    expect(res.body.fields.summary).toEqual('Updated summary');
  });

  it('should delete an issue', async () => {
    const issue = {
      key: 'TASK-222',
      fields: {
        summary: 'Test issue',
        issuetype: { name: 'Task' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };
    dataService.issues.push(issue);

    const res = await request(app).delete('/TASK-222');
    expect(res.statusCode).toEqual(204);
    expect(dataService.issues.length).toEqual(0);
  });

  it('should create a link between two issues', async () => {
    const inwardIssue = {
      key: 'TASK-1',
      fields: {
        summary: 'Test issue',
        issuetype: { name: 'Task' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };
    const outwardIssue = {
      key: 'BUG-1',
      fields: {
        summary: 'Test bug',
        issuetype: { name: 'Bug' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };
    dataService.issues.push(inwardIssue, outwardIssue);

    const res = await request(app).post('/issuelink').send({ inwardLink: 'TASK-1', outwardLink: 'BUG-1' });
    expect(res.statusCode).toEqual(201);
    expect(dataService.issues.find(issue => issue.key === 'TASK-1')?.linkedIssues).toContain('BUG-1');
    expect(dataService.issues.find(issue => issue.key === 'BUG-1')?.linkedIssues).toContain('TASK-1');
  });

  it('should return 404 when linking issues if inward issue does not exist', async () => {
    const outwardIssue = {
      key: 'BUG-2',
      fields: {
        summary: 'Test bug',
        issuetype: { name: 'Bug' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };
    dataService.issues.push(outwardIssue);
    const res = await request(app).post('/issuelink').send({ inwardLink: 'NON-EXISTING', outwardLink: 'BUG-2' });
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 when linking issues if outward issue does not exist', async () => {
    const inwardIssue = {
      key: 'TASK-2',
      fields: {
        summary: 'Test issue',
        issuetype: { name: 'Task' },
        labels: [],
        status: { name: 'To Do', id: '1' },
      },
    };
    dataService.issues.push(inwardIssue);
    const res = await request(app).post('/issuelink').send({ inwardLink: 'TASK-2', outwardLink: 'NON-EXISTING' });
    expect(res.statusCode).toEqual(404);
  });

  it('should return 400 when linking issues with invalid keys (empty strings)', async () => {
    const res = await request(app).post('/issuelink').send({ inwardLink: '', outwardLink: '' });
    expect(res.statusCode).toEqual(400);
  });

  it('should return 400 when linking issues with invalid keys (null)', async () => {
    const res = await request(app).post('/issuelink').send({ inwardLink: null, outwardLink: null });
    expect(res.statusCode).toEqual(400);
  });

  it('should return 400 when linking issues with invalid keys (undefined)', async () => {
    const res = await request(app).post('/issuelink').send({ inwardLink: undefined, outwardLink: undefined });
    expect(res.statusCode).toEqual(400);
  });
});
