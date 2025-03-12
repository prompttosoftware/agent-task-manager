// tests/models/webhook.test.ts

import { Webhook } from '../../src/models/webhook';

describe('Webhook Model', () => {
  it('should create a Webhook instance', () => {
    const webhook = new Webhook('webhook-id', 'webhook-url', 'webhook-event');
    expect(webhook.id).toBe('webhook-id');
    expect(webhook.url).toBe('webhook-url');
    expect(webhook.event).toBe('webhook-event');
  });

  it('should have default properties', () => {
    const webhook = new Webhook('webhook-id', 'webhook-url', 'webhook-event');
    expect(webhook.headers).toEqual({});
  });
});