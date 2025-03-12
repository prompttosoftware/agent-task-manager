// tests/routes/webhook_listing.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/webhooks - Empty List', () => {
  it('should return a 200 OK status code', async () => {
    const response = await request(app).get('/api/webhooks');
    expect(response.status).toBe(200);
  });

  it('should return a JSON array', async () => {
    const response = await request(app).get('/api/webhooks');
    expect(response.headers['content-type']).toEqual(expect.stringContaining('application/json'));
  });

  it('should return an empty array', async () => {
    const response = await request(app).get('/api/webhooks');
    expect(response.body).toEqual([]);
  });
});