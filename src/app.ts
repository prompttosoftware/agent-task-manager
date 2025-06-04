import express from 'express';
import issueRoutes from './api/routes/issueRoutes';

const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies
app.use('/api', issueRoutes); // Mount the issue routes at /api

/**
 * GET /
 * Responds with a simple "Hello, world!" message.
 */
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

export default app;
