import app from './app';
import http from 'http'; // Import http for Node.js core server types and error handling

const PORT = process.env.PORT || 3000;

// Create the server instance by passing the Express app to http.createServer
// or simply use app.listen which returns the http.Server instance.
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors during startup or while running
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      console.error(`An error occurred while starting the server: ${error.message}`);
      throw error; // Re-throw if it's not one of the known listen errors
  }
});

// Optional: Graceful shutdown handling for signals
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// Optional: Handle unhandled promise rejections and uncaught exceptions
// It's good practice to log these and exit for uncaught exceptions to prevent unstable state.
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, cleanup, or exit logic
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, cleanup, or exit logic
  // Exit process to avoid unknown state
  process.exit(1);
});
