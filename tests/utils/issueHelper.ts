// tests/utils/issueHelper.ts
import request from 'supertest';
import app from '../../src/app';

export async function createIssue(issueData: any) {
    const response = await request(app)
        .post('/api/issue')
        .send(issueData)
        .set('Accept', 'application/json')
        .expect(201);
    return response.body;
}

export async function deleteIssue(issueKey: string) {
    await request(app)
        .delete(`/api/issue/${issueKey}`)
        .set('Accept', 'application/json')
        .expect(204);
}
