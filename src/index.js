"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskRoutes_1 = __importDefault(require("./api/taskRoutes"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use('/api/tasks', taskRoutes_1.default);
app.get('/', (req, res) => {
    res.send('Hello, Agent Task Manager!');
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
