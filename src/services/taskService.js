"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTaskById = exports.getAllTasks = void 0;
const Task_1 = require("../models/Task");
// In-memory storage for tasks
let tasks = [];
const getAllTasks = () => {
    return tasks;
};
exports.getAllTasks = getAllTasks;
const getTaskById = (id) => {
    return tasks.find(task => task.id === id);
};
exports.getTaskById = getTaskById;
const createTask = (title, description, dueDate) => {
    const newTask = (0, Task_1.createTask)(title, description, dueDate ? new Date(dueDate) : undefined);
    tasks.push(newTask);
    return newTask;
};
exports.createTask = createTask;
const updateTask = (id, updates) => {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
        throw new Error('Task not found');
    }
    tasks[taskIndex] = Object.assign(Object.assign(Object.assign({}, tasks[taskIndex]), updates), { id: tasks[taskIndex].id });
    return tasks[taskIndex];
};
exports.updateTask = updateTask;
const deleteTask = (id) => {
    tasks = tasks.filter(task => task.id !== id);
    if (!tasks.find(task => task.id === id)) {
        return;
    }
    throw new Error("Task not found");
};
exports.deleteTask = deleteTask;
