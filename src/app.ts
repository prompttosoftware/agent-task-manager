import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { issueRoutes } from './api/routes/issueRoutes';
import issueLinkRoutes from './api/routes/issueLinkRoutes';
import { errorHandler } from './api/middleware/errorHandler';
import { requestLogger } from './api/middleware/requestLogger';
import multer from 'multer';

const app = express();
const port = process.env.PORT || 3000;

// Configure Multer for file uploads (in-memory storage)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.use(bodyParser.json());
app.use(requestLogger);

app.use('/rest/api/3/issue', issueRoutes);
app.use('/rest/api/3/issueLink', issueLinkRoutes);

app.use(errorHandler);

app.get('/', (req: Request, res: Response) => {
  res.send('Agent Task Manager API');
});



export { app, upload, port };