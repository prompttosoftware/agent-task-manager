import { Request, Response, NextFunction } from 'express';
import errorHandler from './errorHandler';

describe('errorHandler', () => {
  it('should handle errors correctly and return a 500 status code with an error message', () => {
    const mockError = new Error('Test error message');
    mockError.statusCode = 500;
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ errorMessages: ['Test error message'] }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle errors with a custom status code', () => {
    const mockError = new Error('Custom error');
    mockError.statusCode = 400;
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ errorMessages: ['Custom error'] }));
  });

  it('should handle errors with errors object', () => {
    const mockError = new Error('Validation error');
    mockError.statusCode = 400;
    mockError.errors = { field1: 'error message' };
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ errors: { field1: 'error message' } }));
  });

  it('should return a 500 status code and default message if no message provided', () => {
    const mockError = {};
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    errorHandler(mockError as any, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ errorMessages: ['Internal Server Error'] }));
  });
});