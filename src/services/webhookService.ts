// src/services/webhookService.ts
import fetch from 'node-fetch';

export class WebhookService {
  async callWebhook(url: string, data: any): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.error(`Webhook call failed: ${response.status} ${response.statusText}`);
        return {
          success: false,
          status: response.status,
          message: response.statusText
        };
      }

      const responseData = await response.json();
      return {
        success: true,
        data: responseData
      };
    } catch (error: any) {
      console.error('Error calling webhook:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}
