import express from 'express';
import errorHandler from './api/middleware/errorHandler';
import requestLogger from './api/middleware/requestLogger';
import issueRoutes from './api/routes/issueRoutes';
import issueLinkRoutes from './api/routes/issueLinkRoutes';
import epicRoutes from './api/routes/epicRoutes';
import metadataRoutes from './api/routes/metadataRoutes';

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/rest/api/3/issue', issueRoutes);
app.use('/rest/api/3/issue-link', issueLinkRoutes);
app.use('/rest/api/3/epic', epicRoutes);
app.use('/rest/api/3/search', issueRoutes); // Re-use issueRoutes for search endpoint
// Mount metadata routes under their own distinct path
app.use('/rest/api/3/metadata', metadataRoutes); 

// Error handling middleware. Must be the last middleware.
app.use(errorHandler);

// Use named export
export { app };
