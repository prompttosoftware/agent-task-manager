// tests/models/webhook.test.ts
import { Webhook } from '../src/models/webhook';

describe('Webhook Model', () => {
  it('should have a name property of type string', () => {
    const webhook: Webhook = {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      filters: { issue_type: 'Bug' },
    };
    expect(typeof webhook.name).toBe('string');
  });

  it('should have a url property of type string', () => {
    const webhook: Webhook = {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      filters: { issue_type: 'Bug' },
    };
    expect(typeof webhook.url).toBe('string');
  });

  it('should have an events property of type string[]', () => {
    const webhook: Webhook = {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      filters: { issue_type: 'Bug' },
    };
    expect(Array.isArray(webhook.events)).toBe(true);
    expect(typeof webhook.events[0]).toBe('string');
  });

  it('should have a filters property of type object', () => {
    const webhook: Webhook = {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      filters: { issue_type: 'Bug' },
    };
    expect(typeof webhook.filters).toBe('object');
    expect(webhook.filters).not.toBeNull();
  });
});