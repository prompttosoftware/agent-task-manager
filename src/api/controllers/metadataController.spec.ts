import { Request, Response, NextFunction } from 'express';
import * as metadataController from './metadataController'; // Import the controller functions

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
  jest.clearAllMocks(); // Clear all mocks, including any potential future mocks
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
  });

  describe('getCreateMetadata', () => {
    // Test the successful execution path
    it('should set Content-Type header to application/json', () => {
      metadataController.getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);
      expect(setHeaderFn).toHaveBeenCalledWith('Content-Type', 'application/json');
    });

    it('should return 200 OK status on success', () => {
      metadataController.getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);
      expect(statusFn).toHaveBeenCalledWith(200);
    });

    it('should return the standard metadata structure in the JSON response on success', () => {
      metadataController.getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);
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
    });

    it('should not call next() on success', () => {
      metadataController.getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not log an error on success', () => {
        metadataController.getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);
        expect(console.error).not.toHaveBeenCalled();
    });


    // --- Error Handling Simulation using Mocks ---
    // These tests simulate errors occurring *during* the response sending process,
    // testing the try...catch block in the controller.

    it('should return 500 and log error if res.setHeader throws', () => {
      const simulatedError = new Error('Simulated setHeader error');
      // Mock setHeader to throw an error
      setHeaderFn.mockImplementationOnce(() => {
        throw simulatedError;
      });

      metadataController.getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify error handling path
      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Failed to create metadata' });
      expect(console.error).toHaveBeenCalledWith('Error creating metadata:', simulatedError);
      expect(mockNext).not.toHaveBeenCalled(); // Error handled by sending response

      // Ensure other response methods weren't called successfully *after* the error
      expect(statusFn).toHaveBeenCalledTimes(1); // Only the error status
      expect(jsonFn).toHaveBeenCalledTimes(1); // Only the error json
    });

     it('should return 500 and log error if res.status throws', () => {
       const simulatedError = new Error('Simulated status error');
       // Mock status to throw an error *after* setHeader is called
       // We need to let the first call (setHeader) succeed
       statusFn.mockImplementationOnce(() => {
           // This first call to status(200) will throw
         throw simulatedError;
       });


       metadataController.getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);

       // Verify sequence and error handling
       expect(setHeaderFn).toHaveBeenCalledWith('Content-Type', 'application/json'); // This should still be called before status
       expect(statusFn).toHaveBeenCalledWith(200); // Attempted before error
       expect(statusFn).toHaveBeenLastCalledWith(500); // Error handling call
       expect(jsonFn).toHaveBeenCalledWith({ error: 'Failed to create metadata' });
       expect(console.error).toHaveBeenCalledWith('Error creating metadata:', simulatedError);
       expect(mockNext).not.toHaveBeenCalled();

       // Ensure status was called twice (attempt success, then error), json once (error)
       expect(statusFn).toHaveBeenCalledTimes(2);
       expect(jsonFn).toHaveBeenCalledTimes(1);
     });

    it('should return 500 and log error if res.json throws', () => {
      const simulatedError = new Error('Simulated json error');
      // Mock json to throw an error *after* setHeader and status(200) are called
      jsonFn.mockImplementationOnce(() => {
        // This first call to json (with success payload) will throw
        throw simulatedError;
      });

      metadataController.getCreateMetadata(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify sequence and error handling
      expect(setHeaderFn).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(statusFn).toHaveBeenCalledWith(200);
      expect(jsonFn).toHaveBeenCalledWith(expect.any(Object)); // Attempted success call before error
      expect(statusFn).toHaveBeenLastCalledWith(500); // Error handling call
      expect(jsonFn).toHaveBeenLastCalledWith({ error: 'Failed to create metadata' }); // Error handling call
      expect(console.error).toHaveBeenCalledWith('Error creating metadata:', simulatedError);
      expect(mockNext).not.toHaveBeenCalled();

      // Ensure status called twice (success attempt, error), json called twice (success attempt, error)
      expect(statusFn).toHaveBeenCalledTimes(2);
      expect(jsonFn).toHaveBeenCalledTimes(2); // Called once for success attempt, once for error
    });

    // --- Notes on Testing Scenarios Not Applicable to Static Implementation ---
    /*
     * The following scenarios mentioned in the request are not directly testable
     * with the *current* implementation of `getCreateMetadata` because it uses
     * hardcoded, static data and does not interact with external systems like a database.
     *
     * - Database Unavailability: No database is accessed.
     * - Invalid Metadata Structure: The structure is statically defined and assumed valid.
     * - Empty Metadata: The metadata is hardcoded and non-empty.
     *
     * If `getCreateMetadata` were refactored to fetch data from a service or database,
     * we would mock *that service/database call* to simulate these conditions:
     *
     * Example (if fetching from `metadataService.fetchData()`):
     *
     * jest.mock('../services/metadataService'); // Mock the service module
     * const mockFetchData = metadataService.fetchData as jest.Mock;
     *
     * it('should handle database error', () => {
     *   mockFetchData.mockRejectedValue(new Error('DB connection failed'));
     *   getCreateMetadata(...);
     *   // Assert 500 error response
     * });
     *
     * it('should handle empty metadata from service', () => {
     *   mockFetchData.mockResolvedValue({ projects: [] }); // Simulate empty data
     *   getCreateMetadata(...);
     *   // Assert appropriate response (e.g., 200 with empty array, or maybe 404/500 depending on requirements)
     * });
     *
     * it('should handle invalid structure from service', () => {
     *    mockFetchData.mockResolvedValue({ invalid_key: "some data" }); // Simulate malformed data
     *    getCreateMetadata(...);
     *    // Assert error handling (e.g., 500 response due to processing error)
     * });
     *
     * The existing error tests (setHeader, status, json throwing) cover general runtime
     * errors within the controller's execution scope.
     */
  });
});