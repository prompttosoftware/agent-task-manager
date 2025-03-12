// tests/models/webhook.test.ts
import { Webhook } from '../../src/models/webhook.model';

describe('Webhook Model', () => {
  it('should have a name', () => {
    const webhook = new Webhook({
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      filters: { issue: { project: ['PROJECT-1'] } },
    });
    expect(webhook.name).toBe('Test Webhook');
  });

  it('should have a URL', () => {
    const webhook = new Webhook({
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      filters: { issue: { project: ['PROJECT-1'] } },
    });
    expect(webhook.url).toBe('https://example.com/webhook');
  });

  it('should have events', () => {
    const webhook = new Webhook({
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      filters: { issue: { project: ['PROJECT-1'] } },
    });
    expect(webhook.events).toEqual(['issue_created']);
  });

  it('should have filters', () => {
    const webhook = new Webhook({
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['issue_created'],
      filters: { issue: { project: ['PROJECT-1'] } },
    });
    expect(webhook.filters).toEqual({ issue: { project: ['PROJECT-1'] } });
  });
});
