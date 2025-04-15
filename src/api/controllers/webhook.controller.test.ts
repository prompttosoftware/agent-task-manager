import request from 'supertest';
import { Express } from 'express';
import { setupApp } from '../../../src/app';
import * as webhookService from '../../services/webhook.service'; // Import as a namespace

describe('Webhook Controller', () => {
    let app: Express;

    beforeAll(async () => {
        app = await setupApp();
    });

    it('should enqueue a webhook', async () => {
        // Mock webhookService functions
        const enqueueWebhookMock = jest.spyOn(webhookService, 'enqueueWebhook');
        const getWebhookQueueSizeMock = jest.spyOn(webhookService, 'getWebhookQueueSize');
        enqueueWebhookMock.mockResolvedValue(undefined); // Webhooks are async functions, so setting a return value is important for mocking, and undefined is the standard return from a void function.
        getWebhookQueueSizeMock.mockReturnValue(1); // Simulate a queue size of 1

        const response = await request(app)
            .post('/api/webhooks')
            .send({ url: 'http://example.com', events: ['issue.created'] });

        expect(response.statusCode).toBe(202);
        expect(webhookService.getWebhookQueueSize()).toBe(1);
        expect(enqueueWebhookMock).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://example.com',
            events: ['issue.created']
        }));

        enqueueWebhookMock.mockRestore();  // Restore the original function
        getWebhookQueueSizeMock.mockRestore();
    });

    it('should return the dead letter queue', async () => {
        const getDeadLetterQueueMock = jest.spyOn(webhookService, 'getDeadLetterQueue');
        getDeadLetterQueueMock.mockReturnValue([]);

        const response = await request(app).get('/api/webhooks/deadletter');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(getDeadLetterQueueMock).toHaveBeenCalled();

        getDeadLetterQueueMock.mockRestore();
    });
});