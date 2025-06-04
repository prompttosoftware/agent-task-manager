import express from 'express';

/**
 * Creates an Express application instance.
 * This instance can be used to define routes, middleware, and start the server.
 */
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

/**
 * The configured Express application instance.
 * @exports app
 */
export { app };
