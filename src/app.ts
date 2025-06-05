import express from 'express';
import taskRoutes from './api/taskRoutes';

const app = express();

app.use(express.json());
app.use('/api/tasks', taskRoutes);

export default app;
