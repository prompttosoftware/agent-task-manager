import app from './app';
import { getDBConnection } from './config/db';

const port = process.env.PORT || 3013;

const startServer = async () => {
  try {
    await getDBConnection();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();