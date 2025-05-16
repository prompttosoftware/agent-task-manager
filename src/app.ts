import express from 'express';
import { v4 as uuidv4 } from 'uuid';

import issueRoutes from '../routes/issueRoutes';
const app = express();

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/rest/api/2', issueRoutes);

export default app;
