// src/services/webhookService.ts

// In-memory storage for webhooks (replace with a database in a real application)
const webhooks: { [key: string]: any } = {};

export const deleteWebhook = async (webhookID: string): Promise<void> => {
  if (!isValidWebhookID(webhookID)) {
    throw new Error('Invalid webhookID');
  }

  if (!webhooks[webhookID]) {
    throw new Error('Webhook not found');
  }

  delete webhooks[webhookID];
};

const isValidWebhookID = (webhookID: string): boolean => {
  // Simple validation: alphanumeric characters only
  return /^[a-zA-Z0-9]+$/.test(webhookID);
};
