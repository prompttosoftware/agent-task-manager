import { Request, Response, NextFunction } from 'express';
import requestLogger from './requestLogger';

describe('requestLogger', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
    };
    mockResponse = {};
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log the request method and URL to the console', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(consoleSpy).toHaveBeenCalledWith('GET /test');
  });

  it('should call the next middleware function', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle different HTTP methods', () => {
    mockRequest.method = 'POST';
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(consoleSpy).toHaveBeenCalledWith('POST /test');
  });

  it('should handle different URLs', () => {
    mockRequest.url = '/another/route';
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(consoleSpy).toHaveBeenCalledWith('GET /another/route');
  });
});