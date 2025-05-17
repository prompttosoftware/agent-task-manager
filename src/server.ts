import app from './app'; // Assuming src/app.ts exports the Express app instance

const PORT = 3000; // Define the port number

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// You could optionally add error handling for the listen event
// server.on('error', (err) => {
//   console.error('Server error:', err);
// });
