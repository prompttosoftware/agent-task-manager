import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { boardRoutes } from './src/api/routes/board.routes';
import { issueRoutes } from './src/api/routes/issue.routes';
import { webhookRoutes } from './src/api/routes/webhook.routes';
import { initializeDatabase } from './src/db/database';
import { config } from './src/config';
import webhookWorker from './src/services/webhookWorker';

const app: Express = express();
const port = config.port;

app.use(bodyParser.json());

// Routes
app.use('/boards', boardRoutes);
app.use('/issues', issueRoutes);
app.use('/webhooks', webhookRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Agent Task Manager');
});

const startServer = async () => {
  try {
    await initializeDatabase();
    await webhookWorker; // Initialize the worker
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer();
