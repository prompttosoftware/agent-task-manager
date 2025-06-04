import express from 'express';
import issueRoutes from './api/routes/issueRoutes';

const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies
// Mount the issue routes at the specific API path /rest/api/2/issue
// Note: The issueRoutes router defines routes with the full path /rest/api/2/issue,
// so it is mounted at the root level here.
app.use(issueRoutes);

/**
 * GET /
 * Responds with a simple "Hello, world!" message.
 */
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

export default app;
