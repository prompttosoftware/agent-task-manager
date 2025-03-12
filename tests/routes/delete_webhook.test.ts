// tests/routes/delete_webhook.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported from app.ts

describe('DELETE /webhooks/{id}', () => {
  it('should delete a webhook given its ID', async () => {
    // Assuming you have a way to create a webhook for testing purposes
    // e.g., a POST /webhooks endpoint
    // and you store the ID somewhere
    const createWebhookResponse = await request(app)
      .post('/webhooks')
      .send({ /* webhook data */ }); // Replace with actual data needed to create webhook

    const webhookId = createWebhookResponse.body.id; // Assuming the response contains the id

    const response = await request(app)
      .delete(`/webhooks/${webhookId}`)
      .expect(200);

    // Optionally, check the response body for success message
    // expect(response.body).toEqual({ message: 'Webhook deleted successfully' });

    // You may want to verify it is deleted.
    // const getResponse = await request(app).get(`/webhooks/${webhookId}`);
    // expect(getResponse.statusCode).toBe(404);
  });

  it('should return 404 if webhook is not found', async () => {
    const webhookId = 'non-existent-id';
    await request(app)
      .delete(`/webhooks/${webhookId}`)
      .expect(404);
  });

  it('should return 400 if the ID is invalid', async () => {
      await request(app)
        .delete('/webhooks/invalid-id')
        .expect(400);
  });
});