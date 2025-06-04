import express from 'express';
import issueRoutes from './api/routes/issueRoutes';

const app = express();

app.use(express.json());
app.use('/rest/api/2', issueRoutes);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
