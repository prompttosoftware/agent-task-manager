import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;
