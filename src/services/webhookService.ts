// src/services/webhookService.ts

import * as dataService from './dataService';
import { Webhook } from '../data/inMemoryStorage';

export const registerWebhook = (webhook: Webhook): Webhook => {
  return dataService.registerWebhook(webhook);
};

export const listWebhooks = (): Webhook[] => {
  return dataService.listWebhooks();
};

export const deleteWebhook = (id: string): boolean => {
  return dataService.deleteWebhook(id);
};

export const triggerWebhook = (eventName: string, data: any): void => {
  dataService.triggerWebhook(eventName, data);
};
