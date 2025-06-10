import express, { Application, Request, Response } from 'express';

const app: Application = express();

app.use(express.json());
app.get('/health', (req: Request, res: Response) => res.status(200).send('OK'));

export default app;
