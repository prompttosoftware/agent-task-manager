import pino from 'pino';
import pinoPretty from 'pino-pretty';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino(
  {
    level: isDevelopment ? 'debug' : 'info',
    timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  },
  isDevelopment
    ? pinoPretty({
        colorize: true,
        translateTime: 'SYS:standard',
      })
    : undefined
);

export default logger;
