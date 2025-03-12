// tests/utils/webhookHelper.ts
import request from 'supertest';
import app from '../../src/app';

export async function createWebhook(url: string, event: string) {
  const response = await request(app)
    .post('/api/webhook')
    .send({ url, event })
    .set('Accept', 'application/json')
    .expect(201);
  return response.body;
}

export async function deleteWebhook(webhookId: string) {
  await request(app)
    .delete(`/api/webhook/${webhookId}`)
    .set('Accept', 'application/json')
    .expect(204);
}
