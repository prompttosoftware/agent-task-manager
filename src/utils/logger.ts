import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info', // Log only messages with severity 'info' and above
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss', // Specify timestamp format
    }),
    format.json(), // Use JSON format for logs
  ),
  transports: [
    new transports.Console(), // Log to the console
  ],
});

export default logger;
