import express from 'express';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Define a basic GET route
app.get('/', (req, res) => {
  // Respond with a 200 status code and a JSON object
  res.status(200).json({ message: "Hello, world!" });
});

// Export the app instance (useful for testing or importing into index.ts)
export default app;