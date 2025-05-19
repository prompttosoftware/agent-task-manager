import express from 'express';

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

// Middleware to parse JSON requests (optional for this basic case, but good practice)
app.use(express.json());

// Define the root route
app.get('/', (req, res) => {
  res.json({ message: 'Hello, world!' });
});

// Start the server (typically done in a separate file like index.ts or server.ts)
// For this specific request targeting only src/app.ts, we won't include the listen call here,
// as app.ts often serves as the module exporting the app instance.
// A typical setup would import 'app' from this file and then call app.listen() elsewhere.

export default app;
