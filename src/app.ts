import express, { Request, Response } from 'express';
import loggingMiddleware from './middleware/logging.middleware';
import logger from './utils/logger';

const app = express();

app.use(express.json());

app.use(loggingMiddleware);

app.get('/testlog', (req, res) => {
  logger.info('Test log route hit');
  res.send('Test log');
});
logger.info("Logging middleware attached");

app.get('/health', (req: Request, res: Response) => res.status(200).send('OK'));

export default app;
