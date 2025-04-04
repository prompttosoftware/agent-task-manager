// src/api/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { WebhookRegisterRequest, WebhookRegisterResponse, WebhookListResponse, WebhookDeleteResponse, WebhookPayload } from '../types/webhook';
import * as webhookService from '../services/webhook.service';
import { verifySignature } from '../../src/utils/signature'; // Assuming you have a utility function for signature verification

/**
 * Handles incoming webhook requests.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A 202 Accepted status if the webhook is successfully enqueued, or an error status if not.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
    try {
        // 1. Validate the request
        const signature = req.headers['x-webhook-signature'] as string | undefined; // Or your custom header name
        const webhookId = req.headers['x-webhook-id'] as string | undefined; // Assuming you'll pass the webhook ID in the header

        // Retrieve the raw body for signature verification.  This is crucial.
        let rawBody = '';
        req.on('data', chunk => {
            rawBody += chunk;
        });

        req.on('end', async () => {
            try {
                const parsedBody = JSON.parse(rawBody); // Parse the body after receiving it
                
                if (!webhookId) {
                    console.warn('Webhook ID is missing.');
                    return res.status(400).send({ message: 'Webhook ID is required.' });
                }

                // 2. Verify the signature (if a secret is used)
                const webhook = await webhookService.getWebhookById(webhookId);

                if (!webhook) {
                    console.warn(`Webhook with ID ${webhookId} not found.`);
                    return res.status(404).send({ message: 'Webhook not found.' });
                }

                if (webhook.secret && signature) {
                    const isValid = verifySignature(rawBody, signature, webhook.secret);
                    if (!isValid) {
                        console.warn('Invalid signature.');
                        return res.status(401).send({ message: 'Invalid signature.' });
                    }
                } else if (webhook.secret && !signature) {
                    console.warn('Missing signature for a webhook that requires it.');
                    return res.status(401).send({ message: 'Missing signature.' });
                }

                // 3. Prepare the payload
                const payload: WebhookPayload = {
                    event: req.headers['x-webhook-event'] as string, // Or however you pass the event type
                    data: parsedBody, // Use the parsed body
                    webhookId: webhookId,
                    timestamp: new Date().toISOString(), // Or get from header
                };

                // 4. Forward to the webhook service
                webhookService.enqueueWebhook(payload); // Use enqueueWebhook from the service

                // 5. Respond to the request
                res.status(202).send({ message: 'Webhook received and enqueued.' });

            } catch (parseError) {
                console.error('Error parsing request body:', parseError);
                res.status(400).send({ message: 'Invalid request body.' });
            }
        });

    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}

/**
 * Registers a new webhook.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A 201 Created status with the new webhook if successful, or an error status if not.
 */
export async function registerWebhook(req: Request, res: Response): Promise<void> {
    try {
        const registerRequest: WebhookRegisterRequest = req.body;
        const webhook: WebhookRegisterResponse = await webhookService.registerWebhook(registerRequest);
        res.status(201).json(webhook);
    } catch (error) {
        console.error('Error registering webhook:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}

/**
 * Lists all webhooks.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A 200 OK status with the list of webhooks if successful, or an error status if not.
 */
export async function listWebhooks(req: Request, res: Response): Promise<void> {
    try {
        const { page, limit } = req.query;
        const pageNumber = page ? parseInt(page as string, 10) : 1;
        const limitNumber = limit ? parseInt(limit as string, 10) : 10;
        const webhooks: WebhookListResponse = await webhookService.listWebhooks(pageNumber, limitNumber);
        res.status(200).json(webhooks);
    } catch (error) {
        console.error('Error listing webhooks:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}

/**
 * Deletes a webhook.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A 200 OK status with a confirmation message if successful, or an error status if not.
 */
export async function deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
        const webhookId = req.params.id;
        const result: WebhookDeleteResponse = await webhookService.deleteWebhook(webhookId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}