// src/api/services/webhook.service.ts

import { Webhook } from '../api/models/webhook'; // Corrected import
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating IDs
import { Database } from '../../src/db/database';

export class WebhookService {
    private database: Database;

    constructor(database: Database) {
        this.database = database;
    }

    async createWebhook(webhookData: Webhook): Promise<Webhook> {
        const id = uuidv4();
        const newWebhook = { ...webhookData, id };
        await this.database.run(
            'INSERT INTO webhooks (id, url, events, active) VALUES (?, ?, ?, ?)',
            [newWebhook.id, newWebhook.url, JSON.stringify(newWebhook.events), newWebhook.active]
        );
        return newWebhook;
    }

    async listWebhooks(): Promise<Webhook[]> {
        const rows = await this.database.all('SELECT * FROM webhooks');
        return rows.map(row => ({
            id: row.id,
            url: row.url,
            events: JSON.parse(row.events),
            active: row.active === 1 ? true : false,
        }));
    }

    async getWebhook(id: string): Promise<Webhook | undefined> {
        const row = await this.database.get('SELECT * FROM webhooks WHERE id = ?', id);
        if (!row) {
            return undefined;
        }
        return {
            id: row.id,
            url: row.url,
            events: JSON.parse(row.events),
            active: row.active === 1 ? true : false,
        };
    }

    async updateWebhook(id: string, webhookData: Partial<Webhook>): Promise<boolean> {
        const existingWebhook = await this.getWebhook(id);

        if (!existingWebhook) {
            return false;
        }

        const { url, events, active } = webhookData;
        await this.database.run(
            'UPDATE webhooks SET url = ?, events = ?, active = ? WHERE id = ?',
            [url ?? existingWebhook.url, JSON.stringify(events ?? existingWebhook.events), active !== undefined ? (active ? 1 : 0) : (existingWebhook.active ? 1 : 0), id]
        );
        return true;
    }

    async deleteWebhook(id: string): Promise<boolean> {
        const result = await this.database.run('DELETE FROM webhooks WHERE id = ?', id);
        return result.changes > 0;
    }
}
