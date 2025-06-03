import app from './app'; // Import the express app
// import * as http from 'http'; // No longer needed as app.listen handles HTTP server creation

const port = 3000; // Define the port

// Use the app.listen method to start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Optional: Handle server closing gracefully (basic example)
// process.on('SIGTERM', () => {
//   server.close(() => {
//     console.log('HTTP server closed.');
//   });
// });
