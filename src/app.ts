import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(express.json());

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

let tasks: Task[] = []; // In-memory storage for tasks

// Existing root route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

// GET all tasks
app.get('/tasks', (req: Request, res: Response) => {
  res.json(tasks);
});

// GET task by ID
app.get('/tasks/:id', (req: Request, res: Response) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  res.json(task);
});

// POST create new task
app.post('/tasks', (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const newTask: Task = {
    id: uuidv4(),
    title,
    completed: false,
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT update task by ID
app.put('/tasks/:id', (req: Request, res: Response) => {
  const taskId = req.params.id;
  const updates = req.body;

  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Basic update - only allow updating title and completed status
  if (updates.title !== undefined) {
      tasks[taskIndex].title = updates.title;
  }
  if (updates.completed !== undefined) {
      tasks[taskIndex].completed = updates.completed;
  }


  res.json(tasks[taskIndex]);
});

// DELETE task by ID
app.delete('/tasks/:id', (req: Request, res: Response) => {
  const taskId = req.params.id;
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id !== taskId);

  if (tasks.length === initialLength) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.status(200).json({ message: 'Task deleted successfully' });
});

export default app;
