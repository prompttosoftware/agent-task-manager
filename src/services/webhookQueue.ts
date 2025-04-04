// src/services/webhookQueue.ts

import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Configuration for Redis - Replace with your actual Redis configuration
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10), // Ensure port is a number
  password: process.env.REDIS_PASSWORD, // Optional, if your Redis requires a password
  db: parseInt(process.env.REDIS_DB || '0', 10), // Optional, Redis database number
};


// Create a Redis connection (using ioredis)
const redisConnection = new Redis(redisOptions);



// Initialize the BullMQ queue
const webhookQueue = new Queue('webhookQueue', {
  connection: redisConnection, // Use the Redis connection
});

export default webhookQueue;