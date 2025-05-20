import express, { Application, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app: Application = express();
const port = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.post('/tasks', (req: Request, res: Response) => {
  const newTask = {
    id: uuidv4(),
    ...req.body,
  };
  res.status(201).json(newTask);
});

export default app;
