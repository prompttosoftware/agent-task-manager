import { Task, createTask as createTaskModelFactory } from '../models/Task';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for tasks
let tasks: Task[] = [];

export const getAllTasks = (): Task[] => {
  return tasks;
};

export const getTaskById = (id: string): Task | undefined => {
  return tasks.find(task => task.id === id);
};

export const createTask = (title: string, description?: string, dueDate?: string): Task => {
    const newTask = createTaskModelFactory(title, description, dueDate ? new Date(dueDate) : undefined);
    tasks.push(newTask);
    return newTask;
};

export const updateTask = (id: string, updates: Partial<Task>): Task => {
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  tasks[taskIndex] = { ...tasks[taskIndex], ...updates, id: tasks[taskIndex].id };
  return tasks[taskIndex];
};

export const deleteTask = (id: string): void => {
  tasks = tasks.filter(task => task.id !== id);
  if (!tasks.find(task => task.id === id)) {
     return;
  }
  throw new Error("Task not found");
};
