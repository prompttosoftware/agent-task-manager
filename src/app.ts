import express from 'express';

/**
 * Creates an Express application instance.
 * This application listens on the root path and responds with "Hello, world!".
 */
const app = express();

// Define the root route
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

export default app;
