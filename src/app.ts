import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from './api/middleware/errorHandler';
import { requestLogger } from './api/middleware/requestLogger';
import issueRoutes from './api/routes/issueRoutes';
import issueLinkRoutes from './api/routes/issueLinkRoutes';
import epicRoutes from './api/routes/epicRoutes';

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/rest/api/3/issue', issueRoutes);
app.use('/rest/api/3/issue-link', issueLinkRoutes);
app.use('/rest/api/3/epic', epicRoutes);
app.use('/rest/api/3/search', issueRoutes);

// Error handling middleware.  Must be the last middleware.
app.use(errorHandler);

export default app;