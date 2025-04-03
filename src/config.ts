// src/config.ts

import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file if present

// Define interfaces/types for better organization and readability

interface DatabaseConfig {
  databasePath: string;
}

interface AgentConfig {
  logLevel: string;
  taskPollingInterval: number;
}

interface AuthConfig {
  jwtSecret: string;
}

interface ServerConfig {
    port: number;
    host: string;
}

// Implement default values and environment variable overrides

const defaultDatabaseConfig: DatabaseConfig = {
  databasePath: process.env.DATABASE_PATH || './data/task_manager.db',
};

const defaultAgentConfig: AgentConfig = {
  logLevel: process.env.AGENT_LOG_LEVEL || 'info',
  taskPollingInterval: parseInt(process.env.AGENT_TASK_POLLING_INTERVAL || '60000', 10), // in milliseconds
};

const defaultAuthConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-secret', // IMPORTANT: Change this in production!
};

const defaultServerConfig: ServerConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
}

// Add environment variables for configuration
interface Configuration {
  [key: string]: any;
  agent: AgentConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  server: ServerConfig;
}

// Combine all configurations into a single config object

export const config: Configuration = {
  server: defaultServerConfig,
  database: defaultDatabaseConfig,
  agent: defaultAgentConfig,
  auth: defaultAuthConfig,
};
