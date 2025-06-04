import express, { Request, Response } from 'express';

// Create a new express application instance
const app: express.Application = express();

// Define a route handler for the default home page
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, world!');
});

export default app;
