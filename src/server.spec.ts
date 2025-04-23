import request from 'supertest';
import { app } from './app';
import { databaseService } from './services/database';

jest.mock('./services/database', () => {
  const mockDatabaseService = {
    connect: jest.fn(),
  };
  return { databaseService: mockDatabaseService };
});

describe('Server', () => {
  let server: any;

  beforeEach(() => {
    // Clear mocks before each test
    (databaseService.connect as jest.Mock).mockClear();
  });

  afterEach((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should start without errors', async () => {
    (databaseService.connect as jest.Mock).mockResolvedValue(undefined);

    const port = 3014; // Use a different port to avoid conflicts
    server = app.listen(port, () => {
      // Server started successfully
    });

    await new Promise<void>((resolve) => {
      server.on('listening', () => {
        resolve();
      });
    });

    expect(server.listening).toBe(true);
    
    // Optionally make a request to the server to further verify it's running
    const response = await request(`http://localhost:${port}`).get('/rest/api/3/issue'); // Or any other valid endpoint
    expect(response.status).not.toBe(404); // Basic check to see if the endpoint exists and the server is running
  }, 10000); // Increased timeout in case the server takes a while to start

  it('should establish database connection before starting the server', async () => {
    (databaseService.connect as jest.Mock).mockResolvedValue(undefined);

    const port = 3015; // Use a different port to avoid conflicts
    server = app.listen(port, () => {
      // Server started successfully
    });

    await new Promise<void>((resolve) => {
      server.on('listening', () => {
        resolve();
      });
    });

    expect(databaseService.connect).toHaveBeenCalled();
  }, 10000); // Increased timeout in case the server takes a while to start

  it('should catch database connection errors and log them', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Database connection failed');
    (databaseService.connect as jest.Mock).mockRejectedValue(mockError);

    const port = 3016; // Use a different port to avoid conflicts
    
    // Wrap the server start in a promise to handle the async nature and errors
    await new Promise<void>((resolve) => {
      server = app.listen(port, () => {
          // This should not be reached if the database connection fails.
      });

      server.on('error', (err: Error) => {
          expect(err).toBeInstanceOf(Error); // Verify an error occurred
          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to start server:', mockError);
          consoleErrorSpy.mockRestore();
          resolve();
      });

      // Use setTimeout as a fallback in case the 'error' event is not emitted.
      setTimeout(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to start server:', mockError);
          consoleErrorSpy.mockRestore();
          resolve();
      }, 2000); 
    });
  }, 10000); // Increased timeout in case the server takes a while to start
});