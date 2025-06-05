import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import taskRoutes from './api/taskRoutes';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api/tasks', taskRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Agent Task Manager!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
