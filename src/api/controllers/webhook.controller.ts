// src/api/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import { createWebhook, deleteWebhook as deleteWebhookService, getAllWebhooks } from '../services/webhook.service';
import { RegisterWebhookRequest, Webhook } from '../../types/webhook';
import { logger } from '../../utils/logger';

export const registerWebhook = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(`Validation errors: ${JSON.stringify(errors.array())}`);
    res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    return;
  }

  try {
    const webhookData: RegisterWebhookRequest = req.body;

    const newWebhook: Webhook = await createWebhook(webhookData);
    logger.info(`Webhook registered successfully: ${newWebhook.id}`);
    res.status(StatusCodes.CREATED).json(newWebhook);
  } catch (error: any) {
    logger.error(`Error registering webhook: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
};

export const deleteWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookId: string = req.params.webhookId;
    await deleteWebhookService(webhookId);
    logger.info(`Webhook deleted successfully: ${webhookId}`);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error: any) {
    logger.error(`Error deleting webhook: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
};

export const listWebhooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhooks: Webhook[] = await getAllWebhooks();
    res.status(StatusCodes.OK).json(webhooks);
  } catch (error: any) {
    logger.error(`Error listing webhooks: ${error.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
};
