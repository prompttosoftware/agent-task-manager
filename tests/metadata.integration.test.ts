import request from 'supertest';
import { app } from '../src/app';
import { IssueType } from '../src/config/static-data';

describe('GET /rest/api/2/issue/createmeta', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/rest/api/2/issue/createmeta');
    expect(response.status).toBe(200);
  });

  it('should return a valid JSON object', async () => {
    const response = await request(app).get('/rest/api/2/issue/createmeta');
    expect(response.type).toBe('application/json');
  });

  it('should contain one project with the key "TASK"', async () => {
    const response = await request(app).get('/rest/api/2/issue/createmeta');
    expect(response.body.projects).toBeDefined();
    expect(response.body.projects.length).toBe(1);
    expect(response.body.projects[0].key).toBe('TASK');
  });

  it('should contain all available issue types', async () => {
    const response = await request(app).get('/rest/api/2/issue/createmeta');
    expect(response.body.projects).toBeDefined();
    expect(response.body.projects[0].issuetypes).toBeDefined();
    expect(response.body.projects[0].issuetypes.length).toBe(Object.keys(IssueType).length / 2);

    // Verify that all issue types from static-data.ts are present in the response
    const responseIssueTypeNames = response.body.projects[0].issuetypes.map((issueType: any) => issueType.name);
    const expectedIssueTypeNames = Object.values(IssueType).filter(value => typeof value === 'string');
    expect(responseIssueTypeNames).toEqual(expect.arrayContaining(expectedIssueTypeNames));
    expect(expectedIssueTypeNames).toEqual(expect.arrayContaining(responseIssueTypeNames));
  });

  it('should return the same response for multiple requests', async () => {
    const response1 = await request(app).get('/rest/api/2/issue/createmeta');
    const response2 = await request(app).get('/rest/api/2/issue/createmeta');
    expect(response1.body).toEqual(response2.body);
  });
});
