import app from './app'; // Assuming app is the default export from app.ts

const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Access the application at http://localhost:${port}`);
});
