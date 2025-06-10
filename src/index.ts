const dotenv = require('dotenv');
dotenv.config();

import logger from './utils/logger';

const logMessage = () => {
  logger.info('Hello, world from the logger!');
};

logMessage();

export default logMessage;
