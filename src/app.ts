import express from 'express';
import { Task } from './models/task';

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// In-memory task storage
let tasks: Task[] = [];
let nextTaskId = 1;

/**
 * Defines the root route.
 * Responds with a simple "Hello, world!" JSON message.
 */
app.get('/', (req, res) => {
  res.json({ message: 'Hello, world!' });
});

// --- Task Routes ---

// GET all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// GET task by ID
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === taskId);

  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

// POST create new task
app.post('/tasks', (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  const newTask: Task = {
    id: nextTaskId++,
    title,
    description,
    completed: false,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT update task by ID
app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex > -1) {
    const updatedTask = { ...tasks[taskIndex], ...req.body };
    tasks[taskIndex] = updatedTask;
    res.json(updatedTask);
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

// DELETE task by ID
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id !== taskId);

  if (tasks.length < initialLength) {
    res.status(204).send(); // No content
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});


export default app;
