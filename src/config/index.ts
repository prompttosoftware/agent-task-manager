import dotenv from 'dotenv';

dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  PROJECT_KEY: process.env.PROJECT_KEY || 'agent-task-manager',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASS: process.env.DB_PASS || 'password',
  DB_NAME: process.env.DB_NAME || 'agent_task_manager',
};

// Freeze the configuration object to prevent modifications
Object.freeze(config);

export default config;
