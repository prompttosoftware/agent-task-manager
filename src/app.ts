import express, { Application, Request, Response } from 'express';

const app: Application = express();
const port = 3000; // Define the port

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, world!');
});

export default app;
