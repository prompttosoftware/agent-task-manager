// src/config.ts

export const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  databasePath: process.env.DATABASE_PATH || './data/task_manager.db',
  agent: {
    logLevel: process.env.AGENT_LOG_LEVEL || 'info',
    taskPollingInterval: parseInt(process.env.AGENT_TASK_POLLING_INTERVAL || '60000', 10), // in milliseconds
    // Add other agent-specific configurations here
  },
};
