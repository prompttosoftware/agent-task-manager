import express from 'express';
import boardRoutes from './routes/board.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();
const port = 3000; // Or your desired port

app.use(express.json()); // for parsing application/json

// API routes
app.use('/api/boards', boardRoutes);

// Error handling middleware (must be after routes)
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
