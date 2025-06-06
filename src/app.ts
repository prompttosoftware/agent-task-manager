import express from 'express';
import issueRoutes from './api/routes/issueRoutes';

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Error handling middleware specifically for JSON parsing errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Check if the error is a SyntaxError and has a status of 400, which is common for bad JSON
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err.message);
    // Optionally send a specific error response to the client
    // res.status(400).send({ message: 'Bad Request: Invalid JSON' });
    // Pass the error along if you have other error handlers, or just call next()
    next(err); // Call next without err to signal handled error, or next(err) to pass it
  } else {
    // Pass other errors to the next error handler
    next(err);
  }
});

// Log request details before hitting the issue routes
app.use('/rest/api', (req, res, next) => {
  console.log('--- Incoming Request (before issueRoutes) ---');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl); // Use originalUrl to show the full path
  console.log('Headers:', req.headers);
  console.log('------------------------------------------');
  next();
});

// Use issue routes
app.use('/rest/api', issueRoutes);

// Log that the request has passed through the '/rest/api' middleware section
// This middleware is reached for paths starting with '/rest/api' if the
// 'issueRoutes' handler did not send a response.
app.use('/rest/api', (req, res, next) => {
  console.log('--- Request passed through /rest/api handler chain ---');
  console.log(`Method: ${req.method}, URL: ${req.originalUrl}`); // Use originalUrl to show the full path
  console.log('Note: This log appears if issueRoutes did not send a response for this path.');
  console.log('----------------------------------------------------');
  next(); // Continue to the next middleware/route handler (e.g., global error handler or 404 if applicable)
});

/**
 * Defines the root route.
 * Responds with a simple "Hello, world!" JSON message.
 */
app.get('/', (req, res) => {
  res.json({ message: 'Hello, world!' });
});


// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack); // Log the error stack trace
  // You can add more specific error handling here if needed
  res.status(500).send({ message: 'Internal Server Error' });
});

export default app;
