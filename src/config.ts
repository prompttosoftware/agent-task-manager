// src/config.ts

export const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  databasePath: process.env.DATABASE_PATH || './data/task_manager.db',
};
