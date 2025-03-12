// src/app.ts
import express from 'express';
import bodyParser from 'body-parser';
import issueRoutes from './routes/issueRoutes';

const app = express();

app.use(bodyParser.json());

app.use('/issues', issueRoutes);

export default app;
