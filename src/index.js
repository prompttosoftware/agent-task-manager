"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const app = (0, express_1.default)();
const port = 3000;
// Middleware to parse JSON request bodies
app.use(express_1.default.json());
let tasks = [];
// Get all tasks
app.get('/tasks', (req, res) => {
    res.json(tasks);
});
// Create a new task
app.post('/tasks', (req, res) => {
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ message: 'Description is required' });
    }
    const newTask = {
        id: (0, uuid_1.v4)(),
        description,
        completed: false,
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});
// Get a specific task by ID
app.get('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const task = tasks.find(task => task.id === id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
});
// Update a task (mark as completed)
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const task = tasks.find(task => task.id === id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    task.completed = true;
    res.json(task);
});
// Delete a task
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
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
