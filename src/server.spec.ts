import { Server } from 'http';
import { AddressInfo } from 'net';
import { databaseService } from './services/database';
import { app } from './app';

jest.mock('./services/database', () => {
  const mockDatabaseService = {
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
  return { databaseService: mockDatabaseService };
});

const originalExit = process.exit;

describe('Server Shutdown', () => {
  let server: Server;
  let port: number;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (databaseService.connect as jest.Mock).mockClear();
    (databaseService.disconnect as jest.Mock).mockClear();

    // Prevent port conflicts by using a dynamic port
    port = Math.floor(Math.random() * 10000) + 3000;
  });

  afterEach((done) => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    if (server) {
      server.close((err) => {
        if (err) {
          console.error('Error closing server in afterEach:', err);
        }
        done();
      });
    } else {
      done();
    }
  });

  const startServer = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      server = app.listen(port, () => {
        resolve();
      });

      server.on('error', (err) => {
        reject(err);
      });
    });
  };


  it('should handle SIGINT gracefully', async () => {
    await startServer();

    // Simulate SIGINT
    process.emit('SIGINT');

    // Wait for shutdown to complete (adjust timeout as needed)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect(consoleLogSpy).toHaveBeenCalledWith('Received SIGINT signal.');
    expect(consoleLogSpy).toHaveBeenCalledWith('Shutting down server...');
    expect(databaseService.disconnect).toHaveBeenCalled();
  }, 10000);


  it('should handle SIGTERM gracefully', async () => {
    await startServer();

    // Simulate SIGTERM
    process.emit('SIGTERM');

    // Wait for shutdown to complete (adjust timeout as needed)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect(consoleLogSpy).toHaveBeenCalledWith('Received SIGTERM signal.');
    expect(consoleLogSpy).toHaveBeenCalledWith('Shutting down server...');
    expect(databaseService.disconnect).toHaveBeenCalled();
  }, 10000);


  it('should exit with non-zero code if database close fails during shutdown', async () => {
    (databaseService.disconnect as jest.Mock).mockRejectedValue(new Error('Database close failed'));
    await startServer();

    // Simulate SIGINT
    process.emit('SIGINT');

    // Wait for shutdown to complete (adjust timeout as needed)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error closing database connection:'));
  }, 10000);


  it('should exit with non-zero code if server close fails during shutdown', async () => {
    jest.spyOn(server, 'close').mockImplementationOnce((callback?: (err?: Error) => void) => {
      if (callback) {
        callback(new Error('Server close failed'));
      }
      return server;
    });

    await startServer();

    // Simulate SIGINT
    process.emit('SIGINT');

    // Wait for shutdown to complete (adjust timeout as needed)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error closing server:'));
  }, 10000);

  it('should handle shutdown timeout', async () => {
    // Mock database close to take longer than the timeout
    (databaseService.disconnect as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 5000))
    );
    await startServer();

    // Simulate SIGINT
    process.emit('SIGINT');

    // Wait for the timeout to occur
    await new Promise((resolve) => setTimeout(resolve, 11000));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Shutdown timed out. Forcefully exiting.');
  }, 20000);
});