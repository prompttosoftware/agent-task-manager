import app from './app';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
