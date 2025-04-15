import request from 'supertest';
import { Express } from 'express';
import { setupApp } from '../../app';
import { enqueueWebhook, getDeadLetterQueue, getWebhookQueueSize } from '../services/webhook.service';

describe('Webhook Controller', () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupApp();
  });

  it('should enqueue a webhook', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({ url: 'http://example.com', events: ['issue.created'] });

    expect(response.statusCode).toBe(202);
    expect(getWebhookQueueSize()).toBe(1);
  });

  it('should return the dead letter queue', async () => {
    // Ensure the dead letter queue is empty initially
    expect(getDeadLetterQueue().length).toBe(0);

    // You might want to simulate a failed webhook and add it to the dead letter queue
    // For example, by sending a webhook to an invalid URL or causing an error in the service.
    // For the purpose of this test, lets mock an error by sending a webhook that fails.

    // const response = await request(app)
    //   .post('/api/webhooks')
    //   .send({ url: 'invalid_url', events: ['issue.created'] });

    // expect(response.statusCode).toBe(202);

    const response = await request(app).get('/api/webhooks/deadletter');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});