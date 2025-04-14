// webhookQueue.ts

/**
 * Represents an in-memory queue for webhooks.
 * @template T The type of data to be stored in the queue.
 */
class WebhookQueue<T> {
  private queue: T[] = [];

  /**
   * Enqueues an item to the queue.
   * @param item The item to enqueue.
   */
  enqueue(item: T): void {
    this.queue.push(item);
  }

  /**
   * Dequeues an item from the queue.
   * @returns The dequeued item, or undefined if the queue is empty.
   */
  dequeue(): T | undefined {
    return this.queue.shift();
  }

  /**
   * Gets the current size of the queue.
   * @returns The size of the queue.
   */
  size(): number {
    return this.queue.length;
  }
}

// Create a new instance of the webhook queue
const webhookQueue = new WebhookQueue<any>();

/**
 * Processes the webhook queue in the background.
 */
async function processWebhookQueue(): Promise<void> {
  setInterval(async () => {
    const item = webhookQueue.dequeue();
    if (item) {
      try {
        // Simulate processing the webhook item
        console.log('Processing webhook item:', item);
        //  Add actual webhook processing logic here
      } catch (error: any) {
        console.error('Error processing webhook item:', error);
      }
    }
  }, 5000); // Process every 5 seconds
}

// Start processing the queue
processWebhookQueue();

export { webhookQueue, processWebhookQueue };