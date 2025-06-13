import express, { Request, Response } from 'express';
import loggingMiddleware from './middleware/logging.middleware';
import { router as issueRoutes } from './routes/issue.routes';
import issueLinkRoutes from './routes/issueLink.routes'; // Import issueLinkRoutes
import logger from './utils/logger';

const app = express();

app.use(express.json());

app.use(loggingMiddleware);

app.use(issueRoutes);
app.use(issueLinkRoutes);

export { app };
