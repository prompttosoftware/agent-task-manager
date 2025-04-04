// src/services/webhookWorker.ts

import { Worker } from 'bullmq';
import webhookQueue from './webhookQueue'; // Import the queue
import { Job } from 'bullmq';

// Define the worker function
const webhookWorker = new Worker(
  'webhookQueue', // Same queue name as used when adding jobs
  async (job: Job<{ url: string; data: any }>) => {
    const { url, data } = job.data;

    console.log(`Processing webhook job with ID: ${job.id}`);
    console.log(`Webhook URL: ${url}`);
    console.log(`Webhook Data:`, data);

    // Simulate sending the webhook
    console.log(`Simulating sending webhook to ${url} with data:`, data);

    // In a real-world scenario, you'd make an HTTP request here (e.g., using fetch or axios)
    // to send the data to the webhook URL.  For example:
    // try {
    //   const response = await fetch(url, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(data),
    //   });
    //   if (!response.ok) {
    //     throw new Error(`Webhook request failed with status ${response.status}`);
    //   }
    //   console.log(`Webhook sent successfully to ${url}`);
    // } catch (error) {
    //   console.error(`Error sending webhook to ${url}:`, error);
    //   // Consider retrying the job or logging the error for later investigation.
    //   throw error; // Re-throw to signal job failure and possible retry.
    // }
    return; // Indicate successful job completion.  Optional: You can return data here too if needed.
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