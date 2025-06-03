import express from 'express';

/**
 * The main Express application instance.
 * Configures middleware and routes for the application.
 */
const app = express();

/**
 * Handles the root route ('/').
 * Responds with a simple "Hello, world!" message.
 */
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

export default app;
