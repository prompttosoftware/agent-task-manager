// Entry point for the application. Imports and starts the express server.

import express from 'express';
import { issueRoutes } from './api/routes/issue.routes';
import { webhookRoutes } from './api/routes/webhook.routes';
import { config } from './config';
import { WebhookWorker } from './services/webhookWorker';
import Database from './db/database';

const app = express();
const port = config.port;

// Initialize the database
const db = new Database('data/task_manager.db');
db.init().then(() => {
  console.log('Database initialized');

  // Initialize WebhookService and WebhookWorker
  const webhookWorker = new WebhookWorker(db);
  webhookWorker.start();

  app.use(express.json());

  app.use('/issues', issueRoutes);
  app.use('/webhooks', webhookRoutes);

  app.get('/', (req, res) => {
    res.send('Agent Task Manager');
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});