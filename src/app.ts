import express, { Request, Response, NextFunction } from 'express';
import loggingMiddleware from './middleware/logging.middleware';
import cors from 'cors';
import logger from './utils/logger';
import config from './config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(loggingMiddleware);

// Routes (Example - replace with your actual routes)
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Agent Task Manager!');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Error handling (Example)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});


const startServer = async () => {
  try {
    app.listen(config.PORT, () => { // Use the imported PORT
      logger.info(`Server is running on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
  }
};

export { app, startServer };
