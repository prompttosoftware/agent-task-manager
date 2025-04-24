import express from 'express';
import errorHandler from './api/middleware/errorHandler';
import requestLogger from './api/middleware/requestLogger';
import issueRoutes from './api/routes/issueRoutes';
import issueLinkRoutes from './api/routes/issueLinkRoutes';
import epicRoutes from './api/routes/epicRoutes';
import metadataRoutes from './api/routes/metadataRoutes';
import { DatabaseService } from './services/databaseService';
import { IssueKeyService } from './services/issueKeyService'; // Import the IssueKeyService type
import { EpicController } from './api/controllers/epicController';

// --- Type Augmentation for Express Request ---
// It's generally recommended to place this in a dedicated types file (e.g., src/types/express/index.d.ts)
// and configure tsconfig.json ("typeRoots": ["./src/types", "./node_modules/@types"]).
// However, for simplicity in this context, we'll place it here.
declare global {
    namespace Express {
        interface Request {
            issueKeyService?: IssueKeyService; // Add optional property
        }
    }
}
// --- End Type Augmentation ---


const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Instantiate services
const databaseService = new DatabaseService();
const issueKeyService = new IssueKeyService(databaseService);
const epicController = new EpicController(databaseService, issueKeyService);

// Routes
app.use('/rest/api/3/issue', issueRoutes);
app.use('/rest/api/3/issue-link', issueLinkRoutes);
app.use('/rest/api/3/epic', epicRoutes(epicController));
app.use('/rest/api/3/search', issueRoutes); // Re-use issueRoutes for search endpoint
// Mount metadata routes under their own distinct path
app.use('/rest/api/3/metadata', metadataRoutes);

// Error handling middleware. Must be the last middleware.
app.use(errorHandler);

// Use named export
export { app };