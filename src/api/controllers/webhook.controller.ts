// src/api/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createWebhook, deleteWebhook as deleteWebhookService, getAllWebhooks } from '../services/webhook.service';
import { RegisterWebhookRequest, Webhook } from '../../types/webhook';
import webhookRegistrationSchema from '../validation/webhook.validation';
import { logger } from '../../utils/logger';

export const registerWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = webhookRegistrationSchema.validate(req.body);

    if (error) {
      logger.error(`Validation error: ${error.details.map((d) => d.message).join(', ')}`);
      res.status(StatusCodes.BAD_REQUEST).json({ errors: error.details.map((d) => d.message) });
      return;
    }

    const webhookData: RegisterWebhookRequest = value as RegisterWebhookRequest;

    const newWebhook: Webhook = await createWebhook(webhookData);
    res.status(StatusCodes.CREATED).json(newWebhook);
  } catch (error: any) {
    logger.error(`Error registering webhook: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
  }
};

export const deleteWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookId: string = req.params.webhookId;
    await deleteWebhookService(webhookId);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error: any) {
    logger.error(`Error deleting webhook: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
  }
};

export const listWebhooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhooks: Webhook[] = await getAllWebhooks();
    res.status(StatusCodes.OK).json(webhooks);
  } catch (error: any) {
    logger.error(`Error listing webhooks: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
  }
};

// Example handleWebhookEvent - this needs to be implemented based on your event handling logic
export const handleWebhookEvent = async (req: Request, res: Response) => {
  // Controller logic
  res.status(200).send('Webhook event received');
};
