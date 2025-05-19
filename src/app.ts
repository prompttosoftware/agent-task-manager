import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000; // Or your preferred port

app.use(express.json()); // For parsing application/json

app.get('/', (req, res) => {
  res.send('Hello, Agent Task Manager!');
});

// Example route with UUID
app.post('/tasks', (req, res) => {
  const taskId = uuidv4();
  res.json({ id: taskId, message: 'Task created' });
});

export default app;
