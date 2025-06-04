import express from 'express';

const app = express();

/**
 * GET /
 * Responds with a simple "Hello, world!" message.
 */
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

export default app;
