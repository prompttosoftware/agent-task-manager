import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send("Hello, world!");
});

app.get('/tasks', (req, res) => {
  // Placeholder for task retrieval logic
  res.json([{ id: uuidv4(), description: 'Sample task' }]);
});

export default app;
