// tests/services/webhookService.test.ts
import { WebhookService } from '../../src/services/webhookService';
import fetch from 'node-fetch';

// Mock the fetch function
jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService();
    mockedFetch.mockClear(); // Clear mock calls before each test
  });

  it('should successfully call a webhook', async () => {
    const mockResponseData = { message: 'Success' };
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponseData),
      status: 200,
      statusText: 'OK'
    } as any);

    const url = 'http://example.com/webhook';
    const data = { event: 'test' };

    const result = await webhookService.callWebhook(url, data);

    expect(mockedFetch).toHaveBeenCalledWith(url, expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }));
    expect(result).toEqual({ success: true, data: mockResponseData });
  });

  it('should handle webhook call failure', async () => {
    const errorMessage = 'Internal Server Error';
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: errorMessage
    } as any);

    const url = 'http://example.com/webhook';
    const data = { event: 'test' };

    const result = await webhookService.callWebhook(url, data);

    expect(mockedFetch).toHaveBeenCalledWith(url, expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }));
    expect(result).toEqual({ success: false, status: 500, message: errorMessage });
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Network Error');
    mockedFetch.mockRejectedValueOnce(error);

    const url = 'http://example.com/webhook';
    const data = { event: 'test' };

    const result = await webhookService.callWebhook(url, data);

    expect(mockedFetch).toHaveBeenCalledWith(url, expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }));
    expect(result).toEqual({ success: false, message: 'Network Error' });
  });
});
