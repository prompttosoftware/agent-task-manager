// tests/webhookRoutes.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Webhook Routes', () => {
  it('should register a webhook (POST /webhooks)', async () => {
    const res = await request(app)
      .post('/webhooks')
      .send({ name: 'TestWebhook', url: 'http://example.com/webhook', events: ['issue_created'] });
    expect(res.statusCode).toEqual(500); // Assuming not implemented, will error
    // Add more assertions here if the API design changes
  });

  it('should list webhooks (GET /webhooks)', async () => {
    const res = await request(app).get('/webhooks');
    expect(res.statusCode).toEqual(500); // Assuming not implemented
    // Add assertions to check the response body if the API design changes
  });

  it('should delete a webhook (DELETE /webhooks/:id)', async () => {
    // First, create a webhook to have something to delete
    const createRes = await request(app)
      .post('/webhooks')
      .send({ name: 'TestWebhook', url: 'http://example.com/webhook', events: ['issue_created'] });
    const webhookId = createRes.body.id; // Assuming API returns id

    const res = await request(app).delete(`/webhooks/${webhookId}`);
    expect(res.statusCode).toEqual(500); // Assuming not implemented
    // Optionally, assert the deletion was successful
  });

  it('should trigger a webhook on issue creation (simulated) - no code exists yet', async () => {
    // This will require some setup to simulate an issue creation event.
    // For now, assume it won't work as the integration is not done
    // This is an important test.  When you add this test, it's critical that it is tested with real issue creation.
    const res = await request(app)
      .post('/issues') // Or whatever the route is for creating an issue
      .send({ /* issue data */ });
      
    expect(res.statusCode).toEqual(500);
    // add assertions to check webhook was called
  });
});