import app from './app'; // Assuming src/app.ts exports the Express app instance

const port = 3000; // Define the port number

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
