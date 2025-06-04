import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import setupIssueRoutes from './api/routes/issueRoutes'; // Corrected import
import { errorHandler } from './utils/errorHandler';

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Routes
setupIssueRoutes(app);

// Error handling middleware (must be after routes)
app.use(errorHandler);

app.get('/', (req: Request, res: Response) => {
  res.send('Agent Task Manager API');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
