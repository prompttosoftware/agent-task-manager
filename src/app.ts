import express from 'express';
import configureApp from './app.config';
import { databaseService } from './services/database';
import { IssueKeyService } from './services/issueKeyService';
import { IssueStatusTransitionService } from './services/issueStatusTransitionService';
import { IssueController } from './api/controllers/issueController';
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

// Instantiate services
const issueKeyService = new IssueKeyService(databaseService);
const issueStatusTransitionService = new IssueStatusTransitionService(databaseService);
const issueController = new IssueController(
    databaseService,
    issueKeyService,
    issueStatusTransitionService
);
const epicController = new EpicController(databaseService, issueKeyService);


// Configure the app with dependency injection
configureApp(app, {
    databaseService,
    issueKeyService,
    issueStatusTransitionService,
},
{
    issueController,
    epicController
});

// Use named export
export { app };