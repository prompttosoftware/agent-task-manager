import app from './app';
import { databaseService } from './services/database';
import { initializeDatabaseSchema } from './config/databaseSchema';


const port = process.env.PORT || 3013;

const startServer = async () => {
  try {
    await databaseService.connect();
    await initializeDatabaseSchema(databaseService);
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();