import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { boardRoutes } from './src/api/routes/board.routes';
import { issueRoutes } from './src/api/routes/issue.routes';
import { webhookRoutes } from './src/api/routes/webhook.routes';
import { initializeDatabase } from './src/db/database';
import { config } from './src/config';
import webhookWorker from './src/services/webhookWorker';
import fs from 'fs';
import path from 'path';

const app: Express = express();
const port = config.port;

app.use(bodyParser.json());

// Create a logs directory if it doesn't exist
const logsDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory);
}

// Define a simple logger function
const logToFile = (message: string, filename: string = 'app.log') => {
  const logFilePath = path.join(logsDirectory, filename);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFilePath, logEntry);
};

// Middleware to log requests
app.use((req, res, next) => {
  logToFile(`${req.method} ${req.url}`, 'requests.log');
  next();
});

// Routes
app.use('/boards', boardRoutes);
app.use('/issues', issueRoutes);
app.use('/webhooks', webhookRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Agent Task Manager');
  logToFile('GET /', 'access.log');
});

const startServer = async () => {
  try {
    await initializeDatabase();
    await webhookWorker; // Initialize the worker
    app.listen(port, () => {
      const message = `Server is running at http://localhost:${port}`;
      console.log(message);
      logToFile(message);
    });
  } catch (error) {
    const errorMessage = `Error starting server: ${error}`;
    console.error(errorMessage);
    logToFile(errorMessage, 'error.log');
  }
};

startServer();
