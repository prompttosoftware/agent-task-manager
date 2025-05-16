import app from './app'; // Import the Express app from app.ts

const port = 3000; // Define the port number

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
