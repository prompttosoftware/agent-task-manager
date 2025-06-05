import express, { Request, Response } from 'express';
import * as taskService from '../services/taskService';
import { Task } from '../models/Task';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const tasks = taskService.getAllTasks();
  res.json(tasks);
});

router.get('/test', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running!' });
});

router.post('/', (req: Request, res: Response) => {
  const { title, description, dueDate } = req.body;
  try {
    const newTask = taskService.createTask(title, description, dueDate);
    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const task = taskService.getTaskById(id);
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, dueDate, status } = req.body;
  try {
    const updatedTask = taskService.updateTask(id, { title, description, dueDate, status });
    res.json(updatedTask);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    taskService.deleteTask(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
