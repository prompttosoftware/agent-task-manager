import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

app.get('/health', (req: Request, res: Response) => res.status(200).send('OK'));

export default app;
