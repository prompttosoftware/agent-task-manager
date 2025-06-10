import { Application } from 'express';
import app from './app';

// Placeholder for configuration - will be implemented in a later step.
// For now, we just define it to avoid a type error.
interface AppConfig {
  PORT: number | string;
}

const config: AppConfig = {
  PORT: process.env.PORT || 3000,
};

const PORT: number | string = config.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
