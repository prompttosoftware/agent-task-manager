// src/app.ts
import express from 'express';
import issueRoutes from './api/routes/issueRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON request bodies
app.use('/', issueRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
