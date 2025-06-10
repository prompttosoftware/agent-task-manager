import { app, startServer } from './app';
import config from './config';
import logger from './utils/logger';

const PORT = config.PORT;

startServer();
