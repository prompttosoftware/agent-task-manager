import express from 'express';
import { loggingMiddleware } from './middleware/logging.middleware';

const app = express();

app.use(loggingMiddleware);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

export default app;
