import pino from 'pino';
import config from '../config';

const logger = pino({
  level: 'debug',
  transport: config.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

export default logger;
