// src/api/controllers/webhook.controller.ts

import { Context, Hono } from 'hono';
import { WebhookService } from '../services/webhook.service';
import { z } from 'zod';


const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
});

export class WebhookController {
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  async registerWebhook(c: Context) {
    const start = Date.now();
    try {
      const body = await c.req.json();
      const { url, events } = webhookSchema.parse(body);
      const webhook = await this.webhookService.createWebhook(url, events);
      const end = Date.now();
      console.log(`registerWebhook succeeded in ${end - start}ms`, { url, events });
      return c.json(webhook, 201);
    } catch (error: any) {
      const end = Date.now();
      console.error(`registerWebhook failed in ${end - start}ms`, { error: error.message, url: c.req.body?.url, events: c.req.body?.events });
      if (error instanceof z.ZodError) {
        return c.json({ message: 'Invalid request body', errors: error.errors }, 400);
      }
      return c.json({ message: error.message }, 500);
    }
  }

  async deleteWebhook(c: Context) {
    const start = Date.now();
    try {
      const webhookId = c.req.param('id');
      if (isNaN(Number(webhookId))) {
        const end = Date.now();
        console.warn(`deleteWebhook received invalid webhook ID ${c.req.param('id')} in ${end - start}ms`);
        return c.json({ message: 'Invalid webhook ID' }, 400);
      }
      await this.webhookService.deleteWebhook(webhookId);
      const end = Date.now();
      console.log(`deleteWebhook succeeded in ${end - start}ms`, { webhookId });
      return c.text(null, 204); // No content
    } catch (error: any) {
      const end = Date.now();
      console.error(`deleteWebhook failed in ${end - start}ms`, { error: error.message, webhookId: c.req.param('id') });
      return c.json({ message: error.message }, 500);
    }
  }

  async listWebhooks(c: Context) {
    const start = Date.now();
    try {
      const webhooks = await this.webhookService.listWebhooks();
      const end = Date.now();
      console.log(`listWebhooks succeeded in ${end - start}ms`, { webhookCount: webhooks.length });
      return c.json(webhooks);
    } catch (error: any) {
      const end = Date.now();
      console.error(`listWebhooks failed in ${end - start}ms`, { error: error.message });
      return c.json({ message: error.message }, 500);
    }
  }

  async getWebhookById(c: Context) {
    const start = Date.now();
    try {
      const webhookId = c.req.param('id');
      if (isNaN(Number(webhookId))) {
        const end = Date.now();
        console.warn(`getWebhookById received invalid webhook ID ${c.req.param('id')} in ${end - start}ms`);
        return c.json({ message: 'Invalid webhook ID' }, 400);
      }
      const webhook = await this.webhookService.getWebhook(webhookId);
      const end = Date.now();
      console.log(`getWebhookById succeeded in ${end - start}ms`, { webhookId });
      if (!webhook) {
        return c.json({ message: 'Webhook not found' }, 404);
      }
      return c.json(webhook);
    } catch (error: any) {
      const end = Date.now();
      console.error(`getWebhookById failed in ${end - start}ms`, { error: error.message, webhookId: c.req.param('id') });
      return c.json({ message: error.message }, 500);
    }
  }
}
