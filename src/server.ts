import { app } from './app';
import { databaseService } from './services/database';
import { initializeDatabaseSchema } from './config/databaseSchema';
import { Server } from 'http';
import { getDBConnection } from './config/db';

const port = process.env.PORT || 3013;
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds, configurable

let server: Server;

const startServer = async () => {
  try {
    const db = await getDBConnection();
    await databaseService.connect(db);
    await initializeDatabaseSchema(databaseService);
    server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1); // Exit process if server fails to start
  }
};

const shutdown = async () => {
  console.log('Shutting down server...');

  try {
    console.log('Closing database connection...');
    await databaseService.disconnect();
    console.log('Database connection closed.');
  } catch (dbError) {
    console.error('Error closing database connection:', dbError);
    // We still try to close the server, even if DB closing fails.
  }

  console.log('Stopping the server from accepting new connections...');
  server.close((err) => {
    if (err) {
      console.error('Error closing server:', err);
      process.exit(1); // Exit with error if server fails to close
    }

    console.log('Server stopped accepting new connections.');

    // Optionally, implement a mechanism to track in-flight requests and wait for them to complete.
    // For simplicity, we'll use a timeout.  In a real-world scenario, you'd want something more robust.

    console.log(`Waiting ${SHUTDOWN_TIMEOUT}ms for in-flight requests to complete...`);
    setTimeout(() => {
      console.log('Shutdown complete. Exiting.');
      process.exit(0); // Clean exit
    }, SHUTDOWN_TIMEOUT);
  });

  // Forcefully exit if shutdown takes too long
  setTimeout(() => {
    console.error('Shutdown timed out. Forcefully exiting.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT * 2); // Double the timeout to give some grace period
};


// Handle SIGINT (Ctrl+C) and SIGTERM (e.g., from Docker)
process.on('SIGINT', () => {
  console.log('Received SIGINT signal.');
  shutdown();
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal.');
  shutdown();
});


startServer();