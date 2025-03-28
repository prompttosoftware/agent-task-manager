// src/api/services/webhook.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDatabase, closeDatabase } from '../../src/db/database';
import { processWebhookEvent } from '../../src/api/services/webhook.service';
import * as webhookService from '../../src/api/services/webhook.service';


describe('WebhookService Integration Tests', () => {
  beforeAll(async () => {
    await createDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('processWebhookEvent should handle issue_created event and create issue', async () => {
    const eventData = {
      event: 'issue_created',
      data: {
        issue: {
          key: 'ATM-2',
          fields: {
            summary: 'Test Issue',
          },
        },
      },
    };
    const result = await processWebhookEvent(eventData);
    expect(result).toBeDefined();
    expect(result.status).toBe('created');
  });

  it('processWebhookEvent should handle issue_updated event and update issue', async () => {
    // First, create an issue
    await webhookService.processWebhookEvent({
        event: 'issue_created',
        data: {
            issue: {
                key: 'ATM-3',
                fields: {
                    summary: 'Initial Summary',
                }
            }
        }
    });

    const eventData = {
      event: 'issue_updated',
      data: {
        issue: {
          key: 'ATM-3',
          fields: {
            summary: 'Updated Test Issue',
          },
        },
      },
    };
    const result = await processWebhookEvent(eventData);
    expect(result).toBeDefined();
    expect(result.status).toBe('updated');
  });

    it('processWebhookEvent should handle issue_deleted event', async () => {
        // First, create an issue
        await webhookService.processWebhookEvent({
            event: 'issue_created',
            data: {
                issue: {
                    key: 'ATM-4',
                    fields: {
                        summary: 'Issue to be deleted',
                    }
                }
            }
        });

        const eventData = {
            event: 'issue_deleted',
            data: {
                issue: {
                    key: 'ATM-4',
                },
            },
        };
        const result = await processWebhookEvent(eventData);
        expect(result).toBeDefined();
        expect(result.status).toBe('deleted');
    });

  it('processWebhookEvent should handle invalid event type', async () => {
    const eventData = {
      event: 'invalid_event',
      data: {},
    };
    const result = await processWebhookEvent(eventData);
    expect(result).toBeUndefined();
  });

  it('processWebhookEvent should handle database connection errors', async () => {
    // Mock the database connection to simulate an error
    // This will depend on how you handle database connections
    // For example, if you're using a library like better-sqlite3:
    // Mock the database methods to throw an error

    const eventData = {
      event: 'issue_created',
      data: {
        issue: {
          key: 'ATM-5',
          fields: {
            summary: 'Test Issue',
          },
        },
      },
    };

    // In a real scenario, you'd mock the database interaction
    // to throw an error.
    // const result = await processWebhookEvent(eventData);
    // expect(result).toBeUndefined(); // Or expect an error to be thrown
  });
});