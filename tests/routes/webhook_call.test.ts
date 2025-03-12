// tests/routes/webhook_call.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your Express app is exported from src/app.ts

// Mock the node-fetch module
jest.mock('node-fetch', () => {
  return {
    __esModule: true,
    default: jest.fn().mockResolvedValue({ // Mock the default export (the fetch function)
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ message: 'Webhook called successfully' }),
    }),
  };
});

import fetch from 'node-fetch';

describe('Webhook Call Endpoint', () => {
  it('should call the webhook URL with the correct data', async () => {
    const webhookUrl = 'https://example.com/webhook';
    const requestBody = { data: 'test data' };

    // Assuming you have an endpoint like POST /webhook
    const response = await request(app)
      .post('/webhook')
      .send({ url: webhookUrl, ...requestBody })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      webhookUrl,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });
});