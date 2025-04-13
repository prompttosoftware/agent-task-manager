export interface Webhook {
  url: string;
  payload: any;
  retryCount?: number;
}
