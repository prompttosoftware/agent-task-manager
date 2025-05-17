import app from './app'; // Assuming app.ts exports the Express app instance
import http from 'http'; // Required for the server error handling event

const port = process.env.PORT || 3000; // Use environment variable for port, default to 3000

// Create the HTTP server
const server = http.createServer(app);

// Start the server and listen on the specified port
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle specific listen errors with friendly messages
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Optional: Handle process exit signals gracefully
process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down server.');
  server.close(() => {
    console.log('Server shut down.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down server.');
  server.close(() => {
    console.log('Server shut down.');
    process.exit(0);
  });
});
