import express, { Request, Response } from 'express';
import loggingMiddleware from './middleware/logging.middleware';
import { router as issueRoutes } from './routes/issue.routes';
import issueLinkRoutes from './routes/issueLink.routes'; // Import issueLinkRoutes
import metadataRoutes from './api/metadata/metadata.routes';
import { MetadataController } from './api/metadata/metadata.controller';
import { MetadataService } from './api/metadata/metadata.service';
import { IssueService } from './services/issue.service';
import logger from './utils/logger';

const app = express();

app.use(express.json());

app.use(loggingMiddleware);

const issueService = new IssueService();
const metadataService = new MetadataService();
const metadataController = new MetadataController(metadataService, issueService);

// Override the metadata routes with the instantiated controller
app.use('/rest/api/2', metadataRoutes(metadataController));

app.use(issueRoutes);
app.use(issueLinkRoutes);

export { app };
