// src/tests/integration/integration.test.ts
import * as request from 'supertest';
import { app } from '@/index'; // Import the app from index.ts
import { Webhook } from '@/api/models/webhook';
import * as webhookService from '@/api/services/webhook.service';

// Before any tests run, start the server.  This assumes you have a way to start the server in index.ts.

describe('Integration Tests', () => {
  describe('Webhook Endpoints', () => {
    it('should create a webhook', async () => {
      const webhookData = {
        url: 'http://example.com/webhook',
        events: ['issue_created'],
        isActive: true,
      };
      const response = await request(app)
        .post('/webhooks')
        .send(webhookData)
        .expect(201);
      expect(response.body).toBeDefined();
      expect(response.body.url).toBe(webhookData.url);
    });

    it('should get all webhooks', async () => {
        const response = await request(app)
          .get('/webhooks')
          .expect(200);
        expect(response.body).toBeDefined();
    });

    it('should update a webhook', async () => {
      const webhookData = {
        url: 'http://updated.com/webhook',
        events: ['issue_updated'],
        isActive: false,
      };
      const existingWebhooks = await webhookService.getAllWebhooks();
      if(existingWebhooks.length === 0) {
        // Create a webhook if none exist
        const createResponse = await request(app)
          .post('/webhooks')
          .send({
            url: 'http://example.com/webhook',
            events: ['issue_created'],
            isActive: true,
          })
          .expect(201);
          
          const webhookId = createResponse.body.id;

          const updateResponse = await request(app)
            .put(`/webhooks/${webhookId}`)
            .send(webhookData)
            .expect(200);

          expect(updateResponse.body.url).toBe(webhookData.url);
          expect(updateResponse.body.isActive).toBe(webhookData.isActive);
      }
       else {
         const webhookId = existingWebhooks[0].id;
         const updateResponse = await request(app)
            .put(`/webhooks/${webhookId}`)
            .send(webhookData)
            .expect(200);

          expect(updateResponse.body.url).toBe(webhookData.url);
          expect(updateResponse.body.isActive).toBe(webhookData.isActive);
       }

      
    });

    it('should delete a webhook', async () => {
      const existingWebhooks = await webhookService.getAllWebhooks();
      if(existingWebhooks.length === 0) {
        // Create a webhook if none exist
        const createResponse = await request(app)
          .post('/webhooks')
          .send({
            url: 'http://example.com/webhook',
            events: ['issue_created'],
            isActive: true,
          })
          .expect(201);
          const webhookId = createResponse.body.id;
          await request(app)
            .delete(`/webhooks/${webhookId}`)
            .expect(200);
      }
      else {
        const webhookId = existingWebhooks[0].id;
        await request(app)
            .delete(`/webhooks/${webhookId}`)
            .expect(200);
      }

    });
  });
});