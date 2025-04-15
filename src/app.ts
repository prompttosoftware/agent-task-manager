import express from 'express';
import issueRoutes from './api/routes/issue.routes';
import webhookRoutes from './api/routes/webhook.routes';
import boardRoutes from './api/routes/board.routes';
import epicRoutes from './api/routes/epic.routes';

export const setupApp = () => {
    const app = express();

    app.use(express.json());

    app.use('/api/issues', issueRoutes);
    app.use('/api/webhooks', webhookRoutes);
    app.use('/api/boards', boardRoutes);
    app.use('/api/epics', epicRoutes);

    return app;
};