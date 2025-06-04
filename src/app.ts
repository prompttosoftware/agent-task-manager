import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import issueRoutes from './api/routes/issueRoutes';

const app = express();

// Apply middleware
app.use(express.json());

// Mount specific routers at dedicated paths
// Mount issue routes. The route defined in issueRoutes.ts (POST /rest/api/2/issue)
// is now mounted at the root path ('/'), making it accessible at POST /rest/api/2/issue.
app.use('/', issueRoutes);

// Define other application routes (optional, example routes)
app.get('/', (req, res) => {
  res.send("Hello, world!");
});

// Example of another non-API route
app.get('/tasks', (req, res) => {
  // Placeholder for task retrieval logic
  // This route is not under the /api path
  res.json([{ id: uuidv4(), description: 'Sample task' }]);
});

export default app;
