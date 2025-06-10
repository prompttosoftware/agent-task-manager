import * as dotenv from 'dotenv';
import path from 'path';
import { cleanEnv, str, num } from 'envalid';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Manually read environment variables
const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    PROJECT_KEY: process.env.PROJECT_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_NAME: process.env.DATABASE_NAME,
};

console.log('Environment Variables:', envVars);

// Define the configuration type
interface IConfig {
  NODE_ENV: string;
  PORT: number;
  PROJECT_KEY: string;
  DATABASE_URL: string;
  DATABASE_NAME: string;
}

// Create the configuration object
const config: IConfig = cleanEnv(envVars, {
  NODE_ENV: str({ default: 'development' }),
  PORT: num({ default: 3000 }),
  PROJECT_KEY: str({ default: 'default' }),
  DATABASE_URL: str({ default: 'postgres://user:password@host:port/database' }),
  DATABASE_NAME: str({ default: 'agent_task_manager' }),
});

// Freeze the configuration object to prevent modifications
Object.freeze(config);

export default config;
