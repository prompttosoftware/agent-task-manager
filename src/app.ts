import express from 'express';

const app = express();
const port = 3000; // Define a port, although not strictly required by the request, it's good practice for a runnable app

// Define the root route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Export the app instance (useful for starting the server in another file)
export default app;

// Optional: Add a listener here if this file is intended to be the entry point
// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });
