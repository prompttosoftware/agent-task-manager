import express, { Express, Request, Response } from 'express';
import issueRoutes from './api/routes/issueRoutes'; // Import issue routes

const app: Express = express();
const port: number = 3000;

// Mount issue routes
app.use('/', issueRoutes); // Use the issue routes

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

export default app;
