"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskService = __importStar(require("../services/taskService"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    const tasks = taskService.getAllTasks();
    res.json(tasks);
});
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Server is running!' });
});
router.post('/', (req, res) => {
    const { title, description, dueDate } = req.body;
    try {
        const newTask = taskService.createTask(title, description, dueDate);
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const task = taskService.getTaskById(id);
    if (task) {
        res.json(task);
    }
    else {
        res.status(404).json({ message: 'Task not found' });
    }
});
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, status } = req.body;
    try {
        const updatedTask = taskService.updateTask(id, { title, description, dueDate, status });
        res.json(updatedTask);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        taskService.deleteTask(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
});
exports.default = router;
