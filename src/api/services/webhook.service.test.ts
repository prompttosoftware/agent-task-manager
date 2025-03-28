// src/api/services/webhook.service.test.ts
import { WebhookService } from './webhook.service';
import { Webhook, WebhookRegisterRequest, WebhookPayload } from '../types/webhook.d';
import { Database } from '../../src/db/database';
import * as crypto from 'crypto';

// Mock the fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Helper function to generate a mock webhook
const createMockWebhook = (overrides: Partial<Webhook> = {}): Webhook => ({
  id: 'mock-webhook-id',
  url: 'http://example.com/webhook',
  events: ['event.created'],
  secret: 'test-secret',
  active: true,
  ...overrides,
});

// Helper function to generate a mock WebhookRegisterRequest
const createMockWebhookRegisterRequest = (overrides: Partial<WebhookRegisterRequest> = {}): WebhookRegisterRequest => ({
  url: 'http://example.com/webhook',
  events: ['event.created'],
  secret: 'test-secret',
  ...overrides,
});

// Helper function to generate a mock WebhookPayload
const createMockWebhookPayload = (overrides: Partial<WebhookPayload> = {}): WebhookPayload => ({
  event: 'event.created',
  data: {test: 'data'},
  ...overrides,
});

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockDb: Database;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockDb = { // Simplified mock
      run: jest.fn().mockResolvedValue({ changes: 1 }),
      all: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockResolvedValue(undefined),
    } as any;
    webhookService = new WebhookService(mockDb);
  });

  it('should register a webhook', async () => {
    const request = createMockWebhookRegisterRequest();
    const expectedWebhook: Webhook = createMockWebhook({id: expect.any(String), ...request, active: true});
    (mockDb.run as jest.Mock).mockResolvedValue({ changes: 1 });

    const result = await webhookService.registerWebhook(request);

    expect(mockDb.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO webhooks'),
      expect.arrayContaining([expectedWebhook.id, expectedWebhook.url, JSON.stringify(expectedWebhook.events), expectedWebhook.secret, 1])
    );
    expect(result.id).toBeDefined();
    expect(result.url).toBe(request.url);
    expect(result.events).toEqual(request.events);
    expect(result.secret).toBe(request.secret);
    expect(result.status).toBe('active');
  });

  it('should handle errors during webhook registration', async () => {
    const request = createMockWebhookRegisterRequest();
    const errorMessage = 'Database error';
    (mockDb.run as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(webhookService.registerWebhook(request)).rejects.toThrow(`Failed to register webhook: ${errorMessage}`);
  });

  it('should delete a webhook', async () => {
    const webhookId = 'some-webhook-id';
    (mockDb.run as jest.Mock).mockResolvedValue({ changes: 1 });

    const result = await webhookService.deleteWebhook(webhookId);

    expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Webhook deleted');
    expect(result.webhookId).toBe(webhookId);
  });

  it('should return webhook not found when deleting a non-existent webhook', async () => {
    const webhookId = 'non-existent-id';
    (mockDb.run as jest.Mock).mockResolvedValue({ changes: 0 });

    const result = await webhookService.deleteWebhook(webhookId);

    expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [webhookId]);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Webhook not found');
    expect(result.webhookId).toBe(webhookId);
  });

  it('should handle errors during webhook deletion', async () => {
    const webhookId = 'some-webhook-id';
    const errorMessage = 'Database error';
    (mockDb.run as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(webhookService.deleteWebhook(webhookId)).rejects.toThrow(`Failed to delete webhook: ${errorMessage}`);
  });

  it('should list webhooks', async () => {
    const mockWebhooks: Webhook[] = [createMockWebhook(), createMockWebhook()];
    (mockDb.all as jest.Mock).mockResolvedValue(mockWebhooks.map(w => ({...w, events: JSON.stringify(w.events), active: w.active ? 1 : 0})));

    const result = await webhookService.listWebhooks();

    expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM webhooks');
    expect(result.webhooks).toEqual(mockWebhooks);
    expect(result.total).toBe(mockWebhooks.length);
  });

  it('should handle errors during webhook listing', async () => {
    const errorMessage = 'Database error';
    (mockDb.all as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(webhookService.listWebhooks()).rejects.toThrow(`Failed to list webhooks: ${errorMessage}`);
  });

  it('should get a webhook by id', async () => {
    const mockWebhook = createMockWebhook();
    (mockDb.get as jest.Mock).mockResolvedValue({...mockWebhook, events: JSON.stringify(mockWebhook.events), active: mockWebhook.active ? 1 : 0});

    const result = await webhookService.getWebhookById(mockWebhook.id);

    expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', [mockWebhook.id]);
    expect(result).toEqual(mockWebhook);
  });

  it('should return undefined if webhook is not found by id', async () => {
    (mockDb.get as jest.Mock).mockResolvedValue(undefined);

    const result = await webhookService.getWebhookById('non-existent-id');

    expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', ['non-existent-id']);
    expect(result).toBeUndefined();
  });

  it('should handle errors when getting webhook by id', async () => {
    const errorMessage = 'Database error';
    (mockDb.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(webhookService.getWebhookById('some-id')).rejects.toThrow(`Failed to get webhook by id: ${errorMessage}`);
  });

  it('should process a webhook event and invoke webhook', async () => {
    const mockWebhook = createMockWebhook();
    const mockPayload = createMockWebhookPayload();
    (mockDb.all as jest.Mock).mockResolvedValue([ { ...mockWebhook, events: JSON.stringify(mockWebhook.events), active: 1 } ]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await webhookService.processWebhookEvent(mockPayload);

    expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', [`%${mockPayload.event}%`]);
    expect(global.fetch).toHaveBeenCalledWith(mockWebhook.url, expect.objectContaining({ method: 'POST', body: JSON.stringify(mockPayload) }));
  });

  it('should process a webhook event and not invoke webhook if event is not matching', async () => {
    const mockWebhook = createMockWebhook();
    const mockPayload = createMockWebhookPayload({event: 'different.event'});
    (mockDb.all as jest.Mock).mockResolvedValue([ { ...mockWebhook, events: JSON.stringify(mockWebhook.events), active: 1 } ]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await webhookService.processWebhookEvent(mockPayload);

    expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE events LIKE ? AND active = 1', [`%${mockPayload.event}%`]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle errors during webhook event processing', async () => {
    const mockPayload = createMockWebhookPayload();
    const errorMessage = 'Database error';
    (mockDb.all as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(webhookService.processWebhookEvent(mockPayload)).rejects.toThrow(`Failed to process webhook event: ${errorMessage}`);
  });

  it('should invoke webhook with signature when secret is provided', async () => {
    const mockWebhook = createMockWebhook();
    const mockPayload = createMockWebhookPayload();
    (mockDb.all as jest.Mock).mockResolvedValue([ { ...mockWebhook, events: JSON.stringify(mockWebhook.events), active: 1 } ]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await webhookService.processWebhookEvent(mockPayload);

    const expectedSignature = crypto.createHmac('sha256', mockWebhook.secret!).update(JSON.stringify(mockPayload)).digest('hex');
    expect(global.fetch).toHaveBeenCalledWith(mockWebhook.url, expect.objectContaining({ headers: expect.objectContaining({ 'X-Webhook-Signature': expectedSignature }) }));
  });

  it('should invoke webhook without signature when secret is not provided', async () => {
    const mockWebhook = createMockWebhook({secret: undefined});
    const mockPayload = createMockWebhookPayload();
    (mockDb.all as jest.Mock).mockResolvedValue([ { ...mockWebhook, events: JSON.stringify(mockWebhook.events), active: 1 } ]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await webhookService.processWebhookEvent(mockPayload);

    expect(global.fetch).toHaveBeenCalledWith(mockWebhook.url, expect.objectContaining({ headers: expect.not.objectContaining({ 'X-Webhook-Signature': expect.anything() }) }));
  });

  it('should handle fetch errors', async () => {
    const mockWebhook = createMockWebhook();
    const mockPayload = createMockWebhookPayload();
    (mockDb.all as jest.Mock).mockResolvedValue([ { ...mockWebhook, events: JSON.stringify(mockWebhook.events), active: 1 } ]);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    await webhookService.processWebhookEvent(mockPayload);

    expect(global.fetch).toHaveBeenCalledWith(mockWebhook.url, expect.any(Object));
  });
});
