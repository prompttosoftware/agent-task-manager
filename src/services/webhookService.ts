// This file will contain the implementation for the webhook service.
import axios from 'axios';
// Import the custom database connection interface and RunResult type
import { getDBConnection, IDatabaseConnection, RunResult } from '../config/db';

// Define the structure of the webhook payload sent externally
interface WebhookPayload {
  timestamp: number;
  webhookEvent: string;
  issue: any; // Define a more specific type if possible based on your issue structure
}

// Define the structure of a webhook record in the database
interface WebhookRow {
    id: number;
    url: string;
    events: string; // Comma-separated list of events
}

/**
 * Creates a new webhook subscription in the database.
 * @param webhookData - Object containing the URL and comma-separated events string.
 * @returns A promise resolving to the newly created webhook object with its ID.
 * @throws Throws an error if the database operation fails.
 */
export const createWebhook = async (webhookData: { url: string; events: string }): Promise<WebhookRow> => {
  try {
    // Use the custom interface for the database connection
    const db: IDatabaseConnection = await getDBConnection();

    // Use the Promise-based 'run' method from the IDatabaseConnection interface
    const result: RunResult = await db.run(
      `INSERT INTO Webhooks (url, events) VALUES (?, ?)`,
      webhookData.url, webhookData.events // Pass parameters directly
    );

    // Check if lastID is valid (should be a number after successful INSERT)
    if (typeof result.lastID === 'number') {
      // Successfully inserted, return the new webhook object including its ID.
      return { id: result.lastID, url: webhookData.url, events: webhookData.events };
    } else {
      // This indicates an unexpected issue, as lastID should be present after INSERT.
      console.error('Error: Failed to retrieve lastID after insert. Result:', result);
      throw new Error('Database did not return last inserted ID after successful insertion.');
    }
  } catch (error: any) {
    // Catch errors from getDBConnection or the db.run operation
    console.error('Error creating webhook:', error.message || error);
    // Re-throw the error so the caller (e.g., API route handler) can handle it.
    throw error;
  }
};

/**
 * Deletes a webhook subscription from the database.
 * @param webhookId - The ID of the webhook to delete.
 * @returns A promise resolving when the deletion is complete.
 * @throws Throws an error if the database operation fails.
 */
export const deleteWebhook = async (webhookId: string): Promise<void> => {
  try {
    // Use the custom interface for the database connection
    const db: IDatabaseConnection = await getDBConnection();

    // Use the Promise-based 'run' method from the IDatabaseConnection interface
    const result: RunResult = await db.run(
      `DELETE FROM Webhooks WHERE id = ?`,
      webhookId // Pass the parameter directly
    );

    // Optional: Log the number of rows affected.
    console.log(`Webhook deletion attempt for ID ${webhookId}. Rows affected: ${result.changes}`);
    // No explicit return needed for void promise on success.
    // If you wanted to ensure one row was deleted, you could check:
    // if (result.changes === 0) {
    //   throw new Error(`Webhook with ID ${webhookId} not found for deletion.`);
    // }
  } catch (error: any) {
    // Catch errors from getDBConnection or the db.run operation
    console.error('Error deleting webhook:', error.message || error);
    throw error;
  }
};

/**
 * Triggers registered webhooks for a specific event type.
 * Fetches matching webhooks from the database and sends POST requests.
 * @param eventType - The type of event that occurred (e.g., 'issue_created').
 * @param issueData - The data related to the event (e.g., the issue object).
 * @returns A promise resolving when all webhook notifications have been attempted.
 */
export async function triggerWebhooks(eventType: string, issueData: any): Promise<void> {
  try {
    // Use the custom interface for the database connection
    const db: IDatabaseConnection = await getDBConnection();

    // Use the Promise-based 'all' method from the IDatabaseConnection interface
    // Specify the expected row type explicitly for type safety
    const webhooks: WebhookRow[] = await db.all<WebhookRow>(
      'SELECT id, url, events FROM Webhooks WHERE events LIKE ?',
      `%${eventType}%` // Use LIKE for comma-separated list, parameter passed directly
    );

    // Filter webhooks again to ensure the exact eventType is listed, not just a substring match
    const filteredWebhooks = webhooks.filter(webhook =>
        webhook.events.split(',').map(e => e.trim()).includes(eventType)
    );

    if (filteredWebhooks.length === 0) {
        console.log(`No webhooks registered for the exact event '${eventType}'.`);
        return; // Nothing more to do
    }

    console.log(`Found ${filteredWebhooks.length} webhooks for event '${eventType}'. Triggering notifications...`);

    // Iterate over each matching webhook and send the payload
    // Use Promise.allSettled to send requests concurrently and handle individual failures
    const sendPromises = filteredWebhooks.map(async (webhook: WebhookRow) => {
      const payload: WebhookPayload = {
        timestamp: Date.now(),
        webhookEvent: eventType,
        issue: issueData, // The actual issue data being triggered
      };

      try {
        console.log(`Attempting to send webhook to ${webhook.url} for event ${eventType}`);
        // Send the payload using an HTTP POST request
        const response = await axios.post(webhook.url, payload, {
          headers: { 'Content-Type': 'application/json' },
          // Consider adding a timeout to prevent long hangs
          timeout: 10000, // 10 seconds timeout
        });
        console.log(`Webhook sent successfully to ${webhook.url} (Status: ${response.status}) for event ${eventType}`);
        return { status: 'fulfilled', url: webhook.url }; // Indicate success
      } catch (error: any) {
        // Log errors related to sending the webhook
        const errorDetails = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.isAxiosError // Check if it's an Axios error for more context
          ? `Axios Error: ${error.message} (Code: ${error.code}, Status: ${error.response?.status})`
          : (error.message || String(error));
        console.error(`Error sending webhook to ${webhook.url} for event ${eventType}:`, errorDetails);
        return { status: 'rejected', url: webhook.url, reason: errorDetails }; // Indicate failure
      }
    });

    // Wait for all requests to settle (either complete or fail)
    const results = await Promise.allSettled(sendPromises);

    // Optional: Log summary of results
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.length - successes;
    console.log(`Webhook trigger summary for event '${eventType}': ${successes} succeeded, ${failures} failed.`);
    if (failures > 0) {
        results.filter(r => r.status === 'rejected').forEach(r => {
            const rejection = r as PromiseRejectedResult; // Type assertion for rejected result
            // Find the original webhook URL if needed (though included in the mapped result)
             const failedWebhook = filteredWebhooks.find(wh => wh.url === (rejection.reason as any)?.url || (rejection as any)?.value?.url); // Adjust based on how URL is passed in rejection/fulfillment
            console.error(` -> Failure details for URL (approx): ${(rejection.reason as any)?.url || 'unknown'} Reason: ${rejection.reason}`);

        });
    }


  } catch (error: any) {
    // Catch errors related to database querying (getDBConnection or db.all)
    console.error(`Error processing webhooks trigger for event ${eventType}:`, error.message || error);
    // Depending on requirements, might want to re-throw this error
    // throw error;
  }
}