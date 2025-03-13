// src/index.ts
import express from 'express';
import issueRoutes from './routes/issueRoutes';
import webhookRoutes from './routes/webhookRoutes';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api', issueRoutes);
app.use('/api', webhookRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
