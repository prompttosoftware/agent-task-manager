// src/api/services/webhook.service.ts

import { Webhook } from '../api/models/webhook';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../../src/db/database';
import { Logger } from '../utils/logger';

export class WebhookService {
    private database: Database;
    private logger: Logger;

    constructor(database: Database, logger: Logger) {
        this.database = database;
        this.logger = logger;
    }

    async createWebhook(webhookData: Webhook): Promise<Webhook> {
        try {
            const id = uuidv4();
            const newWebhook = { ...webhookData, id, active: webhookData.active || false };

            // Input validation
            if (!this.isValidWebhook(newWebhook)) {
                this.logger.error('Invalid webhook data');
                throw new Error('Invalid webhook data');
            }

            await this.database.run(
                'INSERT INTO webhooks (id, url, events, active) VALUES (?, ?, ?, ?)',
                [newWebhook.id, newWebhook.url, JSON.stringify(newWebhook.events), newWebhook.active ? 1 : 0]
            );
            this.logger.info(`Webhook created with id: ${id}`);
            return newWebhook;
        } catch (error: any) {
            this.logger.error(`Error creating webhook: ${error.message}`, error);
            throw error;
        }
    }

    async listWebhooks(): Promise<Webhook[]> {
        try {
            const rows = await this.database.all('SELECT * FROM webhooks');
            return rows.map(row => ({
                id: row.id,
                url: row.url,
                events: JSON.parse(row.events) as string[],
                active: row.active === 1 ? true : false,
            }));
        } catch (error: any) {
            this.logger.error(`Error listing webhooks: ${error.message}`, error);
            throw error;
        }
    }

    async getWebhook(id: string): Promise<Webhook | undefined> {
        try {
            const row = await this.database.get('SELECT * FROM webhooks WHERE id = ?', id);
            if (!row) {
                return undefined;
            }
            return {
                id: row.id,
                url: row.url,
                events: JSON.parse(row.events) as string[],
                active: row.active === 1 ? true : false,
            }; 
        } catch (error: any) {
            this.logger.error(`Error getting webhook with id ${id}: ${error.message}`, error);
            throw error;
        }
    }

    async updateWebhook(id: string, webhookData: Partial<Webhook>): Promise<boolean> {
        try {
            const existingWebhook = await this.getWebhook(id);

            if (!existingWebhook) {
                return false;
            }

            const { url, events, active } = webhookData;

            const updatedUrl = url ?? existingWebhook.url;
            const updatedEvents = events ?? existingWebhook.events;
            const updatedActive = active !== undefined ? active : existingWebhook.active;

            // Input validation
            const updatedWebhook: Webhook = { 
                id: id, 
                url: updatedUrl, 
                events: updatedEvents, 
                active: updatedActive
            };

            if (!this.isValidWebhook(updatedWebhook)) {
                this.logger.error('Invalid webhook data');
                throw new Error('Invalid webhook data');
            }

            await this.database.run(
                'UPDATE webhooks SET url = ?, events = ?, active = ? WHERE id = ?',
                [updatedUrl, JSON.stringify(updatedEvents), updatedActive ? 1 : 0, id]
            );
            this.logger.info(`Webhook updated with id: ${id}`);
            return true;
        } catch (error: any) {
            this.logger.error(`Error updating webhook with id ${id}: ${error.message}`, error);
            return false;
        }
    }

    async deleteWebhook(id: string): Promise<boolean> {
        try {
            const result = await this.database.run('DELETE FROM webhooks WHERE id = ?', id);
            if (result.changes > 0) {
                this.logger.info(`Webhook deleted with id: ${id}`);
            }
            return result.changes > 0;
        } catch (error: any) {
            this.logger.error(`Error deleting webhook with id ${id}: ${error.message}`, error);
            return false;
        }
    }

    private isValidWebhook(webhook: Webhook): boolean {
        if (!webhook.url || !this.isValidURL(webhook.url)) {
            return false;
        }
        if (!webhook.events || !Array.isArray(webhook.events) || webhook.events.length === 0) {
            return false;
        }
        // Add more specific event validation if needed (e.g., check for allowed event types)
        return true;
    }

    private isValidURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }
}
