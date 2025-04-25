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
    const sql = `INSERT INTO Webhooks (url, events) VALUES (?, ?)`;
    // Explicitly define params array
    const params: any[] = [webhookData.url, webhookData.events];

    // Use the Promise-based 'run' method from the IDatabaseConnection interface
    // FIX: Use spread syntax (...) to pass parameters individually, matching the first overload definition.
    // The error "Expected 1-2 arguments, but got 3" likely arose because TypeScript struggled
    // to match `db.run(sql, params)` (where params is an array) definitively to the
    // `run(sql: string, params?: any)` overload vs potentially interpreting it as multiple args.
    // Using spread explicitly resolves this ambiguity and matches `run(sql: string, ...params: any[])`.
    const result: RunResult = await db.run(sql, ...params);

    // Check if lastID is valid (should be a number after successful INSERT)
    // The 'this' context issue (TS2683) likely originated from confusion around callbacks or mocks,
    // but is not relevant here as `result` object is used directly from the promise resolution.
    // The promise wrapper in db.ts correctly resolves with `{ lastID, changes }`.
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
    const sql = `DELETE FROM Webhooks WHERE id = ?`;
    // Explicitly define params array
    const params: any[] = [webhookId];

    // Use the Promise-based 'run' method from the IDatabaseConnection interface
    // FIX: Use spread syntax (...) for consistency and to avoid ambiguity with overloads.
    // This explicitly matches the `run(sql: string, ...params: any[])` signature.
    const result: RunResult = await db.run(sql, ...params);

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
    const sql = 'SELECT id, url, events FROM Webhooks WHERE events LIKE ?';
    // Explicitly define params array
    const params: any[] = [`%${eventType}%`];

    // Use the Promise-based 'all' method from the IDatabaseConnection interface
    // Specify the expected row type explicitly for type safety
    // FIX: Use spread syntax (...) for consistency and to avoid potential overload ambiguity,
    // matching the `all<T = any>(sql: string, ...params: any[])` signature.
    const webhooks: WebhookRow[] = await db.all<WebhookRow>(sql, ...params);

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
        // The axios.post call with 3 arguments (url, data, config) is correct.
        // The TS2554 error previously reported for line 95 was likely incorrect or transient.
        const response = await axios.post(webhook.url, payload, {
          headers: { 'Content-Type': 'application/json' },
          // Consider adding a timeout to prevent long hangs
          timeout: 10000, // 10 seconds timeout
        });
        console.log(`Webhook sent successfully to ${webhook.url} (Status: ${response.status}) for event ${eventType}`);
        return { status: 'fulfilled', url: webhook.url, value: response.status }; // Indicate success
      } catch (error: any) { // FIX: Explicitly typing 'error' as 'any' addresses TS7006.
        // The error message "Parameter 'err' implicitly has an 'any' type" pointing to line 95
        // was likely incorrect in its details (line number and parameter name). This catch
        // correctly handles the error parameter type.
        // Log errors related to sending the webhook
        const errorDetails = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.isAxiosError // Check if it's an Axios error for more context
          ? `Axios Error: ${error.message} (Code: ${error.code}, Status: ${error.response?.status})`
          : (error.message || String(error));
        // Log detailed error information
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
        results.forEach(result => {
            if (result.status === 'rejected') {
                // Extract URL and reason from the settled result structure
                // The structure for rejected promises contains a 'reason' property.
                // We added 'url' to the returned object in the catch block above.
                const reason = result.reason;
                // Attempt to get the URL from the custom structure we returned
                // Use type assertion carefully or check properties exist
                const url = typeof result.reason === 'object' && result.reason !== null && 'url' in result.reason
                                ? (result.reason as any).url
                                : 'unknown URL'; // Fallback if url isn't in reason
                console.error(` -> Failure details for URL ${url}: Reason: ${reason}`);
            }
        });
    }

  } catch (error: any) { // Explicitly typing 'error' as 'any' for the outer catch
    // Catch errors related to database querying (getDBConnection or db.all)
    console.error(`Error processing webhooks trigger for event ${eventType}:`, error.message || error);
    // Depending on requirements, might want to re-throw this error
    // throw error;
  }
}