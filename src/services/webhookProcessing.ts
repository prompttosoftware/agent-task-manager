import { db } from '../db/database';
import { Webhook, WebhookRegisterRequest, WebhookPayload } from '../types/webhook.d';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import winston from 'winston';
import fetch from 'node-fetch'; // Import fetch

const logger = winston.createLogger({
    level: config.agent.logLevel || 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'webhook-service' },
    transports: [
        new winston.transports.Console(),
    ],
});

// --- Existing Functions (No changes needed here) ---
export async function createWebhook(webhookData: WebhookRegisterRequest): Promise<Webhook> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const result = db.prepare(
        'INSERT INTO webhooks (id, callbackUrl, secret, events, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
        id,
        webhookData.callbackUrl,
        webhookData.secret || null,
        JSON.stringify(webhookData.events),
        'active',
        now,
        now
    );

    if (result.changes === 0) {
        throw new Error('Failed to create webhook');
    }

    return {
        id: id,
        callbackUrl: webhookData.callbackUrl,
        secret: webhookData.secret,
        events: webhookData.events,
        status: 'active',
        createdAt: now,
        updatedAt: now
    };
}

export async function getWebhook(id: string): Promise<Webhook | undefined> {
    const row = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id) as Webhook | undefined;

    if (row) {
        row.events = JSON.parse(row.events);
    }

    return row;
}

export async function listWebhooks(): Promise<Webhook[]> {
    const rows = db.prepare('SELECT * FROM webhooks').all() as Webhook[];
    return rows.map(row => {
        row.events = JSON.parse(row.events);
        return row;
    });
}

export async function deleteWebhook(id: string): Promise<boolean> {
    const result = db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
    return result.changes > 0;
}

// --- New Functions ---

/**
 * Retrieves webhooks that are subscribed to a specific event.
 * @param event The event to filter by (e.g., "issue_created").
 * @returns An array of matching Webhook objects.
 */
export async function getWebhooksByEvent(event: string): Promise<Webhook[]> {
    const allWebhooks = await listWebhooks();
    return allWebhooks.filter(webhook => webhook.events.includes(event));
}


/**
 * Constructs the webhook payload in a Jira-like format.
 * @param event The event that triggered the webhook.
 * @param data The data associated with the event.
 * @param webhookId The ID of the webhook.
 * @returns The webhook payload.
 */
export function buildWebhookPayload(event: string, data: any, webhookId: string): WebhookPayload {
    return {
        event: event,
        data: data,
        webhookId: webhookId,
        timestamp: new Date().toISOString(),
    };
}


/**
 * Processes a single webhook delivery with retry logic.
 * @param webhookId The ID of the webhook.
 * @param payload The payload to send.
 * @param retries The number of retries remaining (default 3).
 */
async function deliverWebhookWithRetries(webhookId: string, payload: any, retries: number = 3): Promise<void> {
    const webhook = await getWebhook(webhookId);

    if (!webhook) {
        logger.warn(`Webhook not found for id: ${webhookId}`);
        return; // webhook doesn't exist, stop here
    }

    try {
        const response = await fetch(webhook.callbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorMessage = `Webhook call failed for ${webhookId} with status ${response.status}: ${await response.text()}`;
            logger.error(errorMessage);

            if (retries > 0) {
                logger.info(`Retrying webhook call for ${webhookId}, ${retries} retries remaining.`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
                await deliverWebhookWithRetries(webhookId, payload, retries - 1); // Recursive call
            } else {
                logger.error(`Webhook call failed for ${webhookId} after multiple retries.`);
                // Consider moving the payload to a dead-letter queue (DLQ) here
            }
        } else {
            logger.info(`Webhook call successful for ${webhookId}`);
        }

    } catch (error: any) {
        const errorMessage = `Error calling webhook for ${webhookId}: ${error.message}`;
        logger.error(errorMessage);

        if (retries > 0) {
            logger.info(`Retrying webhook call for ${webhookId}, ${retries} retries remaining.`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            await deliverWebhookWithRetries(webhookId, payload, retries - 1); // Recursive call
        } else {
            logger.error(`Webhook call failed for ${webhookId} after multiple retries.`);
            // Consider moving the payload to a dead-letter queue (DLQ) here
        }
    }
}


/**
 * Processes a single webhook delivery.  This function is now simplified.
 * The retry logic has been moved to deliverWebhookWithRetries.
 * @param webhookId The ID of the webhook.
 * @param payload The payload to send.
 */
export async function processWebhookQueue(webhookId: string, payload: any): Promise<void> {
    logger.info('Processing webhook for ' + webhookId + ' with payload', { payload });
    await deliverWebhookWithRetries(webhookId, payload);
}


/**
 * Triggers webhooks for a specific event.
 * @param event The event that occurred.
 * @param data The data associated with the event.
 */
export async function triggerWebhooks(event: string, data: any): Promise<void> {
    const webhooks = await getWebhooksByEvent(event);
    if (!webhooks || webhooks.length === 0) {
        logger.debug(`No webhooks registered for event: ${event}`);
        return;
    }

    for (const webhook of webhooks) {
        const payload = buildWebhookPayload(event, data, webhook.id);
        await addWebhookPayloadToQueue(webhook.id, payload);  // Use the queue
    }
}



// --- Queueing Functions (Modified to use the new triggerWebhooks function) ---

export interface WebhookQueueItem {
    webhookId: string;
    payload: any;
    timestamp: string;
}

export async function addWebhookPayloadToQueue(webhookId: string, payload: any): Promise<void> {
    // In a real application, you would enqueue the payload.
    // For this example, we'll directly call processWebhookQueue
    await processWebhookQueue(webhookId, payload);
}