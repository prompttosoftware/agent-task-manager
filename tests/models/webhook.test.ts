// tests/models/webhook.test.ts

import { Webhook } from '../../src/models/webhook';

test('Webhook interface should have the correct properties', () => {
  const webhook: Webhook = {
    id: 1,
    url: 'http://example.com/webhook',
    events: ['issue_created', 'issue_updated'],
    active: true,
  };

  expect(webhook.id).toBe(1);
  expect(webhook.url).toBe('http://example.com/webhook');
  expect(webhook.events).toEqual(['issue_created', 'issue_updated']);
  expect(webhook.active).toBe(true);
});
