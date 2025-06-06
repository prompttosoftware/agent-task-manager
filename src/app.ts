import express from 'express';
import taskRoutes from './api/taskRoutes';
import issueRoutes from './api/routes/issueRoutes';

const app = express();

app.use(express.json());
app.use('/api/tasks', taskRoutes);
app.use('/', issueRoutes); // Mount the issue routes

export default app;
