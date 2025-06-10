import express, { Application, Request, Response } from 'express';
import requestId from 'express-request-id';
import loggingMiddleware from './middleware/logging.middleware';

//  Using 'any' to simplify the type definition, as the type Application is not strictly required for basic functionality.
const app = express();

app.use(express.json());
app.use(requestId()); // Generates a unique request ID and attaches it to the request object.
app.use(loggingMiddleware);
app.get('/health', (req: Request, res: Response) => res.status(200).send('OK'));

export default app;
