// src/api/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { createWebhook, deleteWebhook, getAllWebhooks } from '../services/webhook.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Webhook } from '../../src/types/webhook';

// Endpoint to register a new webhook
export const registerWebhook = async (req: Request, res: Response) => {
  try {
    const { url, eventType } = req.body;
    const newWebhook = await createWebhook(url, eventType);
    res.status(201).json(newWebhook);
  } catch (error: any) {
    console.error('Error registering webhook:', error);
    res.status(400).json({ message: error.message });
  }
};

// Endpoint to delete a webhook
export const removeWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteWebhook(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    res.status(404).json({ message: error.message });
  }
};

// Endpoint to retrieve all webhooks
export const listWebhooks = async (req: Request, res: Response) => {
  try {
    const webhooks = await getAllWebhooks();
    res.status(200).json(webhooks);
  } catch (error: any) {
    console.error('Error retrieving webhooks:', error);
    res.status(500).json({ message: 'Failed to retrieve webhooks' });
  }
};

// Function to trigger webhooks for a specific event
export const triggerWebhooks = async (eventType: string, payload: any) => {
  try {
    const webhooks = await getAllWebhooks();

    // Filter webhooks based on the event type
    const filteredWebhooks = webhooks.filter((webhook) => webhook.eventType === eventType);

    // Trigger each webhook asynchronously
    await Promise.all(
      filteredWebhooks.map(async (webhook) => {
        try {
          await axios.post(webhook.url, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Id': webhook.id, // Add a custom header for identification
            },
          });
          console.log(`Webhook ${webhook.id} triggered successfully`);
        } catch (error: any) {
          console.error(`Error triggering webhook ${webhook.id}:`, error.message);
          // Optionally, implement retry logic or error handling here
        }
      })
    );
  } catch (error: any) {
    console.error('Error triggering webhooks:', error);
  }
};

// Example endpoint to simulate an event and trigger webhooks
export const simulateEvent = async (req: Request, res: Response) => {
  try {
    const { eventType, data } = req.body;

    if (!eventType) {
      return res.status(400).json({ message: 'Event type is required' });
    }

    // Trigger webhooks for the specified event type
    await triggerWebhooks(eventType, data);

    res.status(200).json({ message: `Event "${eventType}" simulated successfully` });
  } catch (error: any) {
    console.error('Error simulating event:', error);
    res.status(500).json({ message: 'Failed to simulate event' });
  }
};
