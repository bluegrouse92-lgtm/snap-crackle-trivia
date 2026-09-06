import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const LOGS_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, tag, ...meta }) => {
    const tagPrefix = tag ? `[${tag}] ` : '';
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${tagPrefix}${message}${metaString}`;
  })
);

// Custom format for file output (JSON lines)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports: [
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Error log file
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Helper functions for common contextual tags
export const logHttp = (message: string, meta?: any) => logger.info(message, { tag: 'HTTP', ...meta });
export const logWs = (message: string, meta?: any) => logger.info(message, { tag: 'WEBSOCKET', ...meta });
export const logTrivia = (message: string, meta?: any) => logger.info(message, { tag: 'TRIVIA', ...meta });
export const logLeaderboard = (message: string, meta?: any) => logger.info(message, { tag: 'LEADERBOARD', ...meta });
export const logError = (message: string, error?: any, tag = 'SYSTEM') => {
  logger.error(message, {
    tag,
    errorMessage: error?.message || String(error),
    stack: error?.stack,
  });
};

export default logger;
