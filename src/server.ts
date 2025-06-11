import express, { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import expressApp from './app';
// import config from './config'; // TODO: Implement config

import config from './config';
import logger from './utils/logger';

const PORT = config.PORT || 3000;

import { DataSource } from "typeorm";
import { AppDataSource as MyDataSource } from "./db/data-source";

async function logTableSchemas() {
  try {
    const userSchema = await MyDataSource.initializeAndQuery("PRAGMA table_info('user');");
    console.log("User Table Schema:", userSchema);

    const issueSchema = await MyDataSource.initializeAndQuery("PRAGMA table_info('issue');");
    console.log("Issue Table Schema:", issueSchema);

    const attachmentSchema = await MyDataSource.initializeAndQuery("PRAGMA table_info('attachment');");
    console.log("Attachment Table Schema:", attachmentSchema);

    const issueLinkSchema = await MyDataSource.initializeAndQuery("PRAGMA table_info('issue_link');");
    console.log("Issue Link Table Schema:", issueLinkSchema);

  } catch (error) {
    console.error("Error retrieving table schemas:", error);
  }
}

MyDataSource.initialize()
  .then(() => {
    // Call the function to log table schemas
    logTableSchemas();

    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

expressApp.get('/testlog', (req, res) => {
  logger.info('Test log route hit');
  res.send('Test log');
});
logger.info("Logging middleware attached");

expressApp.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

expressApp.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
