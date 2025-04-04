import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import issueRoutes from './src/api/routes/issue.routes';
import webhookRoutes from './src/api/routes/webhook.routes';
import boardRoutes from './src/api/routes/board.routes';
import { startWebhookWorker } from './src/services/webhookWorker';
import { connect } from './src/db/database';
import { createQueue } from './src/config';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Routes
app.use('/api/issues', issueRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/boards', boardRoutes);

// Initialize database connection
connect()
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });


// Start webhook worker
startWebhookWorker().catch(console.error);

//Start the queue
//createQueue('webhook-queue'); //TODO: remove if not needed. Queue is started in webhookProcessing.ts

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});