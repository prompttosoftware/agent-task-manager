// src/services/webhookWorker.ts

import { Worker } from 'bullmq';
import webhookQueue from './webhookQueue'; // Import the queue
import { Job } from 'bullmq';
import axios from 'axios';

// Define the worker function
const webhookWorker = new Worker(
  'webhookQueue', // Same queue name as used when adding jobs
  async (job: Job<{ url: string; data: any; webhookId: string; event: string }>) => {
    const { url, data, webhookId, event } = job.data;

    console.log(`Processing webhook job with ID: ${job.id}`);
    console.log(`Webhook URL: ${url}`);
    console.log(`Webhook Data:`, data);

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      });

      console.log(`Webhook sent successfully to ${url} with status ${response.status}`);
      // You might want to log the response data here if needed
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Webhook failed to ${url} with status ${error.response.status} and data:`, error.response.data);
        // Log specific error details, consider retrying
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.error(`Webhook failed to ${url} - no response received`);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`Error sending webhook to ${url}:`, error.message);
      }
      // Consider retrying the job or logging the error for later investigation.
      throw error; // Re-throw to signal job failure and possible retry.
    }
    return;
  },
  {
    connection: webhookQueue.client, // Use the Redis connection from the queue
    // Optional:  Specify concurrency (how many jobs can be processed at once)
    concurrency: 1, // Adjust as needed.  Start with 1 to ensure serial processing for now.
  }
);

// Optionally, handle worker events (e.g., errors)
webhookWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

webhookWorker.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error: ${error}`);
});

export default webhookWorker;
