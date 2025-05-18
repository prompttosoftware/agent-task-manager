import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/items', (req, res) => {
  const newItem = {
    id: uuidv4(),
    ...req.body
  };
  res.status(201).json(newItem);
});


export default app;
