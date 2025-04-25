import express, { Application, Request, Response, NextFunction } from 'express';
import errorHandler from './api/middleware/errorHandler';
import requestLogger from './api/middleware/requestLogger';
import issueRoutes from './api/routes/issueRoutes';
import issueLinkRoutes from './api/routes/issueLinkRoutes';
import epicRoutes from './api/routes/epicRoutes';
import metadataRoutes from './api/routes/metadataRoutes';
import { DatabaseService } from './services/databaseService';
import { IssueKeyService } from './services/issueKeyService';
import { IssueController } from './api/controllers/issueController';
import { EpicController } from './api/controllers/epicController';
import { IssueStatusTransitionService } from './services/issueStatusTransitionService';

// --- Type Augmentation for Express Request ---
declare global {
    namespace Express {
        interface Request {
            issueKeyService?: IssueKeyService;
        }
    }
}
// --- End Type Augmentation ---

interface Services {
    databaseService: DatabaseService;
    issueKeyService: IssueKeyService;
    issueStatusTransitionService: IssueStatusTransitionService;
}

interface Controllers {
    issueController: IssueController;
    epicController: EpicController;
}


export default function configureApp(app: Application, services: Services, controllers: Controllers): Application {
    // Middleware
    app.use(express.json());
    app.use(requestLogger);

    // Routes - Injecting controllers
    app.use('/rest/api/3/issue', issueRoutes);
    app.use('/rest/api/3/issue-link', issueLinkRoutes);
    app.use('/rest/api/3/epic', epicRoutes(controllers.epicController));
    app.use('/rest/api/3/search', issueRoutes); // Re-use issueRoutes for search endpoint
    // Mount metadata routes under their own distinct path
    app.use('/rest/api/3/metadata', metadataRoutes);

    // Error handling middleware. Must be the last middleware.
    app.use(errorHandler);

    return app;
}