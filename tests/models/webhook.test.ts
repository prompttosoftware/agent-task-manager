// tests/models/webhook.test.ts
import { Webhook } from '../src/models/webhook';

describe('Webhook Model', () => {
  it('should create a Webhook instance', () => {
    const webhook = new Webhook({
      url: 'https://example.com/webhook',
      event: 'issue_created',
      isActive: true,
    });
    expect(webhook).toBeInstanceOf(Webhook);
  });

  it('should have correct properties', () => {
    const url = 'https://example.com/webhook';
    const event = 'issue_updated';
    const isActive = false;

    const webhook = new Webhook({
      url,
      event,
      isActive,
    });

    expect(webhook.url).toBe(url);
    expect(webhook.event).toBe(event);
    expect(webhook.isActive).toBe(isActive);
  });

  it('should throw an error if url is missing', () => {
    // @ts-ignore
    expect(() => new Webhook({ event: 'test', isActive: true })).toThrowError();
  });

  it('should throw an error if event is missing', () => {
    // @ts-ignore
    expect(() => new Webhook({ url: 'test', isActive: true })).toThrowError();
  });
});