import { Request, Response, NextFunction } from 'express';
import errorHandler from './errorHandler';
import { CustomError } from './customError';

describe('errorHandler', () => {
  it('should handle errors correctly and return a 500 status code with an error message', () => {
    const mockError = new CustomError('Test error message', 500);
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ errorMessages: ['Test error message'] }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle errors with a custom status code', () => {
    const mockError = new CustomError('Custom error', 400);
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ errorMessages: ['Custom error'] }));
  });

  it('should handle errors with errors object', () => {
    const mockError = new CustomError('Validation error', 400, { field1: 'error message' });
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ errors: { field1: 'error message' } }));
  });

  it('should return a 500 status code and default message if no message provided', () => {
    const mockError = new CustomError('Internal Server Error', 500);
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    errorHandler(mockError, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ errorMessages: ['Internal Server Error'] }));
  });
});