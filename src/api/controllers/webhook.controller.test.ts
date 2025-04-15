import request from 'supertest';
import { Express } from 'express';
import { setupApp } from '../../src/app';
import { WebhookService } from '../services/webhook.service';
import { WebhookPayload } from '../../types/webhook';

jest.mock('../services/webhook.service');

describe('WebhookController', () => {
  let app: Express;
  let webhookService: jest.Mocked<WebhookService>;

  beforeEach(async () => {
    app = await setupApp();
    webhookService = {
      createWebhook: jest.fn(),
    } as jest.Mocked<WebhookService>;
    (WebhookService as jest.Mock).mockImplementation(() => webhookService);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(webhookService).toBeDefined();
  });

  it('should return 201 on successful webhook creation', async () => {
    const mockPayload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
    (webhookService.createWebhook as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/webhook')
      .send(mockPayload)
      .set('Content-Type', 'application/json');

    expect(response.statusCode).toBe(201);
    expect(webhookService.createWebhook).toHaveBeenCalledWith(mockPayload);
  });

  it('should return 400 on invalid payload', async () => {
    const response = await request(app).post('/api/webhook').send({}).set('Content-Type', 'application/json');
    expect(response.statusCode).toBe(400);
  });
});