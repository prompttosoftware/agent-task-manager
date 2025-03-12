// src/server.ts
import express from 'express';
import { Application } from 'express';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/', routes);
app.use(errorHandler);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
