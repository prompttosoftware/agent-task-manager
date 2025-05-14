import { app } from './app'; // Assuming app.ts will export 'app'

console.log('Server process starting...');

const port = 3000; // Need port here if server.ts starts the server

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Add handlers for unhandled errors at the process level.
// These catch errors that are not caught by express middleware or route handlers.
process.on('uncaughtException', (err) => {
  console.error('FATAL ERROR: Uncaught Exception');
  console.error(err);
  // Perform any necessary cleanup before exiting, e.g., close database connections, flush logs
  // Optionally, close the server gracefully before exiting
  // server.close(() => {
  //   process.exit(1);
  // });
  // For fatal errors like uncaught exceptions, immediate exit might be safer.
  process.exit(1); // Exit the process with a failure code
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL ERROR: Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Perform any necessary cleanup
  // Optionally, close the server gracefully before exiting
  // server.close(() => {
  //   process.exit(1);
  // });
  // For unhandled rejections, usually indicates a promise wasn't caught. Often still fatal.
  process.exit(1); // Exit the process with a failure code
});

console.log('Server entry point script finished execution.');
// The process stays alive because app.listen() was called here,
// which started the HTTP server and keeps the Node.js event loop running.
