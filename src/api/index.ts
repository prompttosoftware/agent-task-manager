import express from 'express';
import bodyParser from 'body-parser';
import boardRoutes from './routes/board.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api', boardRoutes);

app.get('/', (req, res) => {
  res.send('Agent Task Manager API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;