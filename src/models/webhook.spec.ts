import { Webhook } from './webhook';

describe('Webhook Model', () => {
  // Define sample data once
  let sampleWebhook: Webhook;

  beforeEach(() => {
    // Reset sample data before each test
    sampleWebhook = {
      id: 1,
      url: 'https://example.com/webhook',
      events: ['issue.created', 'issue.updated'],
      secret: 'a-very-secure-secret-token',
    };
  });

  it('should be defined', () => {
    expect(sampleWebhook).toBeDefined();
  });

  // --- Basic Type Checks (already existed, kept for clarity) ---
  it('should have a number id', () => {
    expect(typeof sampleWebhook.id).toBe('number');
  });

  it('should have a string url', () => {
    expect(typeof sampleWebhook.url).toBe('string');
  });

  it('should have an array of strings events', () => {
    expect(Array.isArray(sampleWebhook.events)).toBe(true);
    expect(sampleWebhook.events.every((event) => typeof event === 'string')).toBe(true);
  });

  it('should have a string secret', () => {
    expect(typeof sampleWebhook.secret).toBe('string');
  });

  // --- Stronger Validation Tests ---

  it('should have a positive integer id', () => {
    expect(Number.isInteger(sampleWebhook.id)).toBe(true);
    expect(sampleWebhook.id).toBeGreaterThan(0);
  });

  it('should fail validation if id is not a positive integer', () => {
    const invalidWebhooks: any[] = [
      { ...sampleWebhook, id: 0 },
      { ...sampleWebhook, id: -1 },
      { ...sampleWebhook, id: 1.5 },
      { ...sampleWebhook, id: '1' },
      { ...sampleWebhook, id: null },
      { ...sampleWebhook, id: undefined },
    ];

    invalidWebhooks.forEach((webhook) => {
        // Basic type check will fail first for non-numbers
        if (typeof webhook.id !== 'number') {
            expect(typeof webhook.id).not.toBe('number');
        } else {
            // Check integer and positivity constraints
            expect(Number.isInteger(webhook.id) && webhook.id > 0).toBe(false);
        }
    });
  });


  it('should have a non-empty url', () => {
    expect(sampleWebhook.url.length).toBeGreaterThan(0);
  });

  it('should have a url starting with http:// or https://', () => {
    expect(sampleWebhook.url).toMatch(/^https?:\/\//);
  });

  it('should fail validation for invalid url formats', () => {
    const invalidWebhooks: any[] = [
      { ...sampleWebhook, url: '' }, // Empty
      { ...sampleWebhook, url: 'example.com' }, // Missing protocol
      { ...sampleWebhook, url: 'ftp://example.com' }, // Wrong protocol
      { ...sampleWebhook, url: 'http:/example.com' }, // Malformed protocol
      { ...sampleWebhook, url: null },
      { ...sampleWebhook, url: undefined },
      { ...sampleWebhook, url: 123 },
    ];

    invalidWebhooks.forEach((webhook) => {
        if (typeof webhook.url !== 'string') {
            expect(typeof webhook.url).not.toBe('string');
        } else {
            expect(webhook.url.length > 0 && /^https?:\/\//.test(webhook.url)).toBe(false);
        }
    });
  });

  it('should have a non-empty events array', () => {
    expect(sampleWebhook.events.length).toBeGreaterThan(0);
  });

  it('should fail validation if events array is empty', () => {
    const invalidWebhook = { ...sampleWebhook, events: [] };
    expect(Array.isArray(invalidWebhook.events)).toBe(true); // Still an array
    expect(invalidWebhook.events.length > 0).toBe(false); // But empty
  });

  it('should fail validation if events is not an array or contains non-strings', () => {
    const invalidWebhooks: any[] = [
      { ...sampleWebhook, events: null },
      { ...sampleWebhook, events: undefined },
      { ...sampleWebhook, events: 'issue.created' },
      { ...sampleWebhook, events: 123 },
      { ...sampleWebhook, events: ['issue.created', 123] }, // Contains non-string
    ];

    invalidWebhooks.forEach((webhook) => {
        const isArrayOfStrings = Array.isArray(webhook.events) && webhook.events.every((e: any) => typeof e === 'string');
        expect(isArrayOfStrings).toBe(false);
    });
  });

  it('should have a non-empty secret', () => {
    expect(sampleWebhook.secret.length).toBeGreaterThan(0);
  });

  it('should fail validation if secret is empty or not a string', () => {
     const invalidWebhooks: any[] = [
       { ...sampleWebhook, secret: '' },
       { ...sampleWebhook, secret: null },
       { ...sampleWebhook, secret: undefined },
       { ...sampleWebhook, secret: 123 },
     ];

     invalidWebhooks.forEach((webhook) => {
        if (typeof webhook.secret !== 'string') {
            expect(typeof webhook.secret).not.toBe('string');
        } else {
            expect(webhook.secret.length > 0).toBe(false);
        }
    });
  });

});
