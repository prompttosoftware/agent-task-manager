/**
 * Entry point of the application.
 * Sets up and starts the Express server.
 */
import app from './app'; // Import the Express application instance

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
