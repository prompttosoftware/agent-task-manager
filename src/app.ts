import express, { Request, Response } from 'express';
import loggingMiddleware from './middleware/logging.middleware';
import logger from './utils/logger';

const app = express();

app.use(express.json());

app.use(loggingMiddleware);

export default app;
