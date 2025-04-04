// src/api/services/webhook.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebhookService } from './webhook.service';
import { WebhookRegistration, Webhook } from '../api/types/webhook.d';
import { WebhookModel } from '../api/models/webhook';

vi.mock('../api/models/webhook');

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register a webhook successfully', async () => {
    const registration: WebhookRegistration = { event: 'issue.created', url: 'https://example.com/webhook' };
    const mockWebhook: Webhook = { id: 1, ...registration };
    (WebhookModel.create as jest.Mock).mockResolvedValue(mockWebhook);

    const result = await webhookService.registerWebhook(registration);

    expect(result).toEqual(mockWebhook);
    expect(WebhookModel.create).toHaveBeenCalledWith(registration);
  });

  it('should handle errors during webhook registration', async () => {
    const registration: WebhookRegistration = { event: 'issue.created', url: 'https://example.com/webhook' };
    const errorMessage = 'Failed to create webhook';
    (WebhookModel.create as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(webhookService.registerWebhook(registration)).rejects.toThrowError(errorMessage);
    expect(WebhookModel.create).toHaveBeenCalledWith(registration);
  });

  it('should list webhooks successfully', async () => {
    const mockWebhooks: Webhook[] = [
      { id: 1, event: 'issue.created', url: 'https://example.com/webhook1' },
      { id: 2, event: 'issue.updated', url: 'https://example.com/webhook2' },
    ];
    (WebhookModel.getAll as jest.Mock).mockResolvedValue(mockWebhooks);

    const result = await webhookService.listWebhooks();

    expect(result).toEqual(mockWebhooks);
    expect(WebhookModel.getAll).toHaveBeenCalled();
  });

  it('should handle errors when listing webhooks', async () => {
    const errorMessage = 'Failed to retrieve webhooks';
    (WebhookModel.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(webhookService.listWebhooks()).rejects.toThrowError(errorMessage);
    expect(WebhookModel.getAll).toHaveBeenCalled();
  });
});
