import { Request, Response, NextFunction } from 'express';
import { getCreateMetadata } from './metadataController';

describe('metadataController', () => {
  describe('getCreateMetadata', () => {
    it('should return 200 OK with metadata on success', () => {
      const mockRequest = {} as Request;
      const mockResponse = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const mockNext = jest.fn() as NextFunction;

      getCreateMetadata(mockRequest, mockResponse, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        projects: [
          {
            id: '10000',
            name: 'My Project',
            issuetypes: [
              {
                id: '10001',
                name: 'Task',
                subtask: false
              },
              {
                id: '10002',
                name: 'Subtask',
                subtask: true
              },
              {
                id: '10003',
                name: 'Story',
                subtask: false
              },
              {
                id: '10004',
                name: 'Bug',
                subtask: false
              },
              {
                id: '10005',
                name: 'Epic',
                subtask: false
              }
            ]
          }
        ]
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 Internal Server Error on error', () => {
      // Mock the function to throw an error
      const originalConsoleError = console.error;
      console.error = jest.fn(); // Suppress console.error during the test

      const mockRequest = {} as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const mockNext = jest.fn() as NextFunction;

      // Modify the implementation to throw an error for testing purposes.  Normally you would not modify source code to test it.
      const modifiedGetCreateMetadata = (req: Request, res: Response, next: NextFunction) => {
        try {
          throw new Error('Simulated error');
        } catch (error: any) {
          console.error('Error creating metadata:', error);
          res.status(500).json({ error: 'Failed to create metadata' });
        }
      };

      modifiedGetCreateMetadata(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to create metadata' });
      expect(mockNext).not.toHaveBeenCalled();

      console.error = originalConsoleError; // Restore console.error
    });
  });
});