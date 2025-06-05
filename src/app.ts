import express, { Application, Request, Response } from 'express';
import issueRoutes from './api/routes/issueRoutes';

const app: Application = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount the issue routes
app.use('/rest/api', issueRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Agent Task Manager API');
});

export default app;
