import pino from 'pino';
import pretty from 'pino-pretty';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: 'info',
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        },
      }
    : {}),
});

export default logger;
