import express from 'express';
import issueRoutes from './api/routes/issueRoutes';

/**
 * Creates an Express application instance.
 * This application listens on the root path and responds with "Hello, world!".
 */
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Use the issue routes
app.use('/api/issues', issueRoutes);

// Define the root route
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

export default app;
