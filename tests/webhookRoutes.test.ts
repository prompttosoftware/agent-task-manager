// tests/webhookRoutes.test.ts
import request from 'supertest';
import app from '../src/app';
import { Webhook } from '../src/models/webhook';

describe('Webhook Routes', () => {
  describe('DELETE /webhooks/:id', () => {
    it('should delete a webhook', async () => {
      // Create a webhook first
      const createResponse = await request(app)
        .post('/webhooks')
        .send({ url: 'http://example.com/webhook', events: ['issue_created'] })
        .expect(201);

      const webhookId = createResponse.body.id;

      const response = await request(app)
        .delete(`/webhooks/${webhookId}`)
        .expect(204);

      // Verify that the webhook is deleted (e.g., by trying to fetch it)
      const getResponse = await request(app)
        .get(`/webhooks/${webhookId}`)
        .expect(404);
    });

    it('should return 404 if webhook is not found', async () => {
      const response = await request(app)
        .delete('/webhooks/nonexistent_id')
        .expect(404);
    });
  });
});