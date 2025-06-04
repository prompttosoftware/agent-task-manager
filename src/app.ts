import express from 'express';

const app = express();

/**
 * Handles the root route request.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

export default app;
