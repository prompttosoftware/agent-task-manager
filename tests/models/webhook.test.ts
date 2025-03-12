// tests/models/webhook.test.ts
import { Webhook } from '../../src/models/webhook';

describe('Webhook Model', () => {
  it('should create a webhook with the correct properties', () => {
    const webhook = new Webhook('WEBHOOK-1', 'https://example.com');
    expect(webhook.id).toBe('WEBHOOK-1');
    expect(webhook.url).toBe('https://example.com');
  });
});