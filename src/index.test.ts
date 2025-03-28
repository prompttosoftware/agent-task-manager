import request from 'supertest';
import { app } from './index'; // Assuming your Express app is exported

describe('API Endpoints', () => {
  it('should return OK for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('OK');
  });

  it('should add an attachment', async () => {
    const res = await request(app)
      .post('/issue/ISSUE-123/attachment')
      .attach('file', Buffer.from('file content'), 'test.txt');

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.issueId).toEqual('ISSUE-123');
    expect(res.body.fileName).toEqual('test.txt');
    expect(res.body.filePath).toContain('/usr/src/app/attachments/');
  });
});