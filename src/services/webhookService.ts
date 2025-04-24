// This file will contain the implementation for the webhook service.
import axios from 'axios';
import { getDBConnection } from '../config/db';
// Import RunResult type if @types/sqlite3 is available and configured
// import { RunResult } from 'sqlite3';

interface WebhookPayload {
  timestamp: number;
  webhookEvent: string;
  issue: any;
}

export const createWebhook = async (webhookData: { url: string; events: string }) => {
  try {
    const db = await getDBConnection();
    // Using Promise to handle the async callback nature of db.run
    const newWebhook = await new Promise<{ id: number; url: string; events: string }>((resolve, reject) => {
      db.run(
        `INSERT INTO Webhooks (url, events) VALUES (?, ?)`,
        [webhookData.url, webhookData.events],
        // Use a standard function declaration to ensure 'this' refers to the sqlite3 statement object.
        // Arrow functions would capture the lexical 'this', which is incorrect here.
        function (err: Error | null) {
          if (err) {
            console.error('Error inserting webhook into database:', err.message);
            reject(err);
          } else {
            // 'this' inside this function is bound by the sqlite3 library to an object
            // containing properties like 'lastID' (for INSERT) and 'changes'.
            // We use 'as any' for type casting flexibility if @types/sqlite3 isn't strictly configured.
            // Check if 'this' is defined and 'lastID' is present before accessing it.
            if (this && typeof (this as any).lastID !== 'undefined') {
              // Successfully inserted, resolve with the new webhook object including its ID.
              resolve({ id: (this as any).lastID, url: webhookData.url, events: webhookData.events });
            } else {
              // This scenario indicates an unexpected issue: the query succeeded (no err),
              // but the context object ('this') or 'lastID' is missing.
              console.error('Error: Failed to retrieve lastID after insert. `this` context:', this);
              reject(new Error('Database did not return last inserted ID after successful insertion.'));
            }
          }
        }
      );
    });

    // Return the newly created webhook object { id, url, events }
    return newWebhook;
  } catch (error: any) {
    // Catch errors from getDBConnection, the Promise rejection, or other synchronous issues
    console.error('Error creating webhook:', error.message || error);
    // Re-throw the error so the caller (e.g., API route handler) can handle it appropriately.
    throw error;
  }
};

export const deleteWebhook = async (webhookId: string) => {
  try {
    const db = await getDBConnection();
    await new Promise<void>((resolve, reject) => {
      // Using function() here as well, although 'this' is less critical for DELETE
      // unless checking 'this.changes'
      db.run(
        `DELETE FROM Webhooks WHERE id = ?`,
        [webhookId],
        function (err: Error | null) { // Use function for potential 'this.changes' access
          if (err) {
            console.error('Error deleting webhook from database:', err.message);
            reject(err);
          } else {
            // Optional: check this.changes to see if a row was actually deleted
            // if ((this as any).changes === 0) {
            //   reject(new Error(`Webhook with ID ${webhookId} not found.`));
            // } else {
            //   resolve();
            // }
            resolve();
          }
        }
      );
    });
  } catch (error: any) {
    console.error('Error deleting webhook:', error.message || error);
    throw error;
  }
};

export async function triggerWebhooks(eventType: string, issueData: any) {
  try {
    const db = await getDBConnection();
    // Fetch all webhooks subscribed to the specific event type
    const webhooks: any[] = await new Promise((resolve, reject) => {
      // Using LIKE allows events stored as comma-separated strings (e.g., "issue.created,issue.updated")
      // Ensure the eventType is properly escaped or handled if it contains SQL special characters.
      // Using parameterized query `?` protects against SQL injection.
      db.all('SELECT id, url, events FROM Webhooks WHERE events LIKE ?', [`%${eventType}%`], (err, rows: any[]) => {
        if (err) {
          console.error('Error fetching webhooks from database:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });


    // Iterate over each matching webhook and send the payload
    for (const webhook of webhooks) {
      const payload: WebhookPayload = {
        timestamp: Date.now(),
        webhookEvent: eventType,
        issue: issueData, // The actual issue data being triggered
      };

      try {
        console.log(`Attempting to send webhook to ${webhook.url} for event ${eventType}`);
        // Send the payload using an HTTP POST request
        await axios.post(webhook.url, payload, {
          headers: { 'Content-Type': 'application/json' },
          // Consider adding a timeout to prevent long hangs
          // timeout: 5000, // e.g., 5 seconds
        });
        console.log(`Webhook sent successfully to ${webhook.url} for event ${eventType}`);
      } catch (error: any) {
        // Log errors related to sending the webhook (e.g., network issues, invalid URL, server error response)
        console.error(`Error sending webhook to ${webhook.url} for event ${eventType}:`, error.response?.data || error.message || error);
        // Decide if processing should continue for other webhooks or stop. Currently continues.
      }
    }
  } catch (error: any) {
    // Catch errors related to database querying
    console.error(`Error processing webhooks for event ${eventType}:`, error.message || error);
    // Depending on requirements, might want to throw this error
    // throw error;
  }
}