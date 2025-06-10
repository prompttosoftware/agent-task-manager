import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

interface IConfig {
  NODE_ENV: string;
  PORT: number;
  PROJECT_KEY: string | undefined;
  DATABASE_URL: string | undefined;
  DATABASE_USERNAME: string | undefined;
  DATABASE_PASSWORD: string | undefined;
  DATABASE_NAME: string | undefined;
}

const config: IConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  PROJECT_KEY: process.env.PROJECT_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_USERNAME: process.env.DATABASE_USERNAME,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
  DATABASE_NAME: process.env.DATABASE_NAME,
};

Object.freeze(config);

export default config;
