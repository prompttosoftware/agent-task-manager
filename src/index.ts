import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

interface Task {
    id: string;
    description: string;
    completed: boolean;
}

let tasks: Task[] = [];

// Get all tasks
app.get('/tasks', (req: Request, res: Response) => {
    res.json(tasks);
});

// Create a new task
app.post('/tasks', (req: Request, res: Response) => {
    const { description } = req.body as { description: string };
    if (!description) {
        return res.status(400).json({ message: 'Description is required' });
    }

    const newTask: Task = {
        id: uuidv4(),
        description,
        completed: false,
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Get a specific task by ID
app.get('/tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const task = tasks.find(task => task.id === id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
});

// Update a task (mark as completed)
app.put('/tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const task = tasks.find(task => task.id === id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    task.completed = true;
    res.json(task);
});

// Delete a task
app.delete('/tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }
    tasks.splice(taskIndex, 1);
    res.status(204).send(); // No content
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
