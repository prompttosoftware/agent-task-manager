export interface WebhookPayload {
    eventId: string;
    eventType: string;
    data: any;
}

export { WebhookPayload };