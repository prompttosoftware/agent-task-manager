import express from 'express';
import issueRoutes from './api/routes/issueRoutes';

const app = express();

app.use(express.json());

app.use('/rest/api/3/issue', issueRoutes);

export default app;