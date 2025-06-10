import express, { Application, Request, Response, Router } from 'express';

const app: Application = express();
const router: Router = Router();

app.use(express.json());

router.get('/health', (req: Request, res: Response): Response => {
  return res.status(200).send('OK');
});

app.use('/api', router);

export default app;
