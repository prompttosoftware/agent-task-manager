import express from 'express';

const app = express();

// Middleware to parse JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic root route (optional for minimal setup, but useful for testing)
// app.get('/', (req, res) => {
//   res.send('Express app is running!');
// });

// Export the app instance
export default app;
