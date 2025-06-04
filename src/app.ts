import express, { Express, Request, Response } from 'express';

const app: Express = express();
const port: number = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

const server = app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Optional: Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('[server]: SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[server]: HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('[server]: SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[server]: HTTP server closed');
  });
});
