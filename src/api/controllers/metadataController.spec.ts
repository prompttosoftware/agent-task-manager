import { Request, Response, NextFunction } from 'express';
import { getCreateMetadata } from './metadataController';

// Mock the console.error to prevent test output pollution and allow assertion
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError; // Restore original console.error
});

beforeEach(() => {
  // Reset mocks before each test
  (console.error as jest.Mock).mockClear();
});

describe('metadataController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusFn: jest.Mock;
  let jsonFn: jest.Mock;
  let setHeaderFn: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnThis(); // Allows chaining .json()
    setHeaderFn = jest.fn();
    mockResponse = {
      setHeader: setHeaderFn,
      status: statusFn,
      json: jsonFn,
    };
    mockNext = jest.fn();
    statusFn.mockClear();
    jsonFn.mockClear();
    setHeaderFn.mockClear();
  });

  describe('getCreateMetadata', () => {
    it('should return 200 OK with the standard metadata structure on success', () => {
      getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);

      expect(setHeaderFn).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith({
        projects: [
          {
            id: '10000',
            name: 'My Project',
            issuetypes: [
              { id: '10001', name: 'Task', subtask: false },
              { id: '10002', name: 'Subtask', subtask: true },
              { id: '10003', name: 'Story', subtask: false },
              { id: '10004', name: 'Bug', subtask: false },
              { id: '10005', name: 'Epic', subtask: false },
            ],
          },
        ],
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should return 500 Internal Server Error if setting header fails', () => {
      const simulatedError = new Error('Simulated setHeader error');
      // Mock setHeader to throw an error
      setHeaderFn.mockImplementationOnce(() => {
        throw simulatedError;
      });

      getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify error handling path
      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Failed to create metadata' });
      expect(console.error).toHaveBeenCalledWith('Error creating metadata:', simulatedError);
      expect(mockNext).not.toHaveBeenCalled(); // Should not call next on error handled by sending response

      // Ensure other response methods weren't called successfully *after* the error
      expect(statusFn).toHaveBeenCalledTimes(1); // Only the error status
      expect(jsonFn).toHaveBeenCalledTimes(1); // Only the error json
    });

     it('should return 500 Internal Server Error if sending status fails', () => {
       const simulatedError = new Error('Simulated status error');
       // Mock status to throw an error after setHeader is called
       statusFn.mockImplementationOnce(() => {
         throw simulatedError;
       });

       getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);

       // Verify error handling path
       expect(setHeaderFn).toHaveBeenCalledWith('Content-Type', 'application/json'); // This should still be called before status
       expect(statusFn).toHaveBeenCalledWith(200);
       expect(statusFn).toHaveBeenCalledWith(500);
       expect(jsonFn).toHaveBeenCalledWith({ error: 'Failed to create metadata' });
       expect(console.error).toHaveBeenCalledWith('Error creating metadata:', simulatedError);
       expect(mockNext).not.toHaveBeenCalled();

       // Ensure status and json are called only once, and with the error response
       expect(statusFn).toHaveBeenCalledTimes(2);
       expect(jsonFn).toHaveBeenCalledTimes(1);
     });

    it('should return 500 Internal Server Error if sending JSON fails', () => {
      const simulatedError = new Error('Simulated json error');
      // Mock json to throw an error
      jsonFn.mockImplementationOnce(() => {
        throw simulatedError;
      });

      getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify error handling path
      expect(setHeaderFn).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Failed to create metadata' });
      expect(console.error).toHaveBeenCalledWith('Error creating metadata:', simulatedError);
      expect(mockNext).not.toHaveBeenCalled();

      // Ensure status and json are called only once, and with the error response
      expect(statusFn).toHaveBeenCalledTimes(2);
      expect(jsonFn).toHaveBeenCalledTimes(1);
    });

    // Note: Testing for "database unavailability", "variations in metadata structure",
    // or "empty metadata" is not directly applicable to the current static implementation
    // of getCreateMetadata, as it doesn't interact with a database or dynamic data sources.
    // The error tests above simulate general internal failures that could occur for various
    // reasons, including issues that *might* stem from data source problems if the
    // controller were more complex. If the controller were fetching data, we would mock
    // the data fetching function to simulate these scenarios (e.g., throw DB error, return empty array, return malformed data).
  });
});
