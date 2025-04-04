import { Queue, Job } from 'bull';
import Redis from 'ioredis';

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const createQueue = (queueName: string): Queue => {
  const redis = new Redis(redisOptions);
  return new Queue(queueName, {
    defaultJobOptions: {
      attempts: parseInt(process.env.JOB_ATTEMPTS || '3', 10),
      backoff: {
        type: 'exponential',
        delay: parseInt(process.env.JOB_BACKOFF_DELAY || '1000', 10),
      },
    },
    redis,
  });
};
