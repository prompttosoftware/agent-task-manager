import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { WebhookPayload } from '../types/webhook';
import logger from '../utils/logger';

export interface WebhookService {
  processWebhook(payload: WebhookPayload): Promise<void>;
}

@Injectable()
export class WebhookService implements WebhookService {
  constructor(private readonly configService: ConfigService) {}

  async processWebhook(payload: WebhookPayload): Promise<void> {
    // Implement your webhook processing logic here
    logger.info('Processing webhook:', payload);
    // Example: Send data to a queue or perform other actions
  }
}
