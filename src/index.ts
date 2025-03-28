// Entry point for the application. Imports and starts the express server.

import express from 'express';
import { issueRoutes } from './api/routes/issue.routes';
import { webhookRoutes } from './api/routes/webhook.routes';
import { config } from './config';

const app = express();
const port = config.port;

app.use(express.json());

app.use('/issues', issueRoutes);
app.use('/webhooks', webhookRoutes);

app.get('/', (req, res) => {
  res.send('Agent Task Manager');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});