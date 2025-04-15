import express, { Express } from 'express';
import issueRoutes from './api/routes/issue.routes';
import webhookRoutes from './api/routes/webhook.routes';
import boardRoutes from './api/routes/board.routes';
import epicRoutes from './api/routes/epic.routes';
import { BoardService } from './api/services/board.service';
import { ConfigService } from './config/config.service';
import { WebhookService } from './api/services/webhook.service';

export const setupApp = (
    boardService?: BoardService,
    configService?: ConfigService,
    webhookService?: WebhookService
): Express => {
    const app = express();

    app.use(express.json());

    if (boardService) {
        app.use('/api/boards', boardRoutes(boardService));
    }
    if (webhookService) {
      app.use('/api/webhooks', webhookRoutes(webhookService));
    }
     else {
       app.use('/api/webhooks', webhookRoutes);
     }
    app.use('/api/issues', issueRoutes);
    app.use('/api/epics', epicRoutes);

    return app;
};
