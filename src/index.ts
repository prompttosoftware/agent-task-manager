// src/index.ts
import express from 'express';
import bodyParser from 'body-parser';
import issueRoutes from './routes/index';
import * as dataService from './services/dataService';

const app = express();
const port = 3000;

app.use(bodyParser.json());

dataService.initializeBoards();

app.use('/', issueRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});