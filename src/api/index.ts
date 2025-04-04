import express, { Request, Response } from 'express';
import boardRoutes from './api/routes/board.routes';
import { errorMiddleware } from './api/middleware/error.middleware';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', boardRoutes);

// Error handling middleware
app.use(errorMiddleware);

app.get('/', (req: Request, res: Response) => {
  res.send('Agent Task Manager API');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
