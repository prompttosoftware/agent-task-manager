import { createIssue, getIssue, updateIssue, deleteIssue, getAllIssues, createWebhookEndpoint, deleteWebhookEndpoint, linkIssues } from './issueController';
import { Request, Response, NextFunction } from 'express';
import { formatIssueResponse } from '../../utils/jsonTransformer';

// Mock the db module
jest.mock('../../config/db', () => ({
    getDBConnection: jest.fn()
}));

describe('IssueController', () => {
  it('should create an issue', async () => {
    const mockRequest = {} as Request;
    const mockResponse = { 
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await createIssue(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith('createIssue endpoint');
  });

  it('should get an issue', async () => {
    const mockRequest = {} as Request;
    const mockResponse = { 
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await getIssue(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith('getIssue endpoint');
  });

  it('should update an issue', async () => {
    const mockRequest = {} as Request;
    const mockResponse = { 
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await updateIssue(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith('updateIssue endpoint');
  });

  it('should delete an issue', async () => {
    const mockRequest = {} as Request;
    const mockResponse = { 
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await deleteIssue(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith('deleteIssue endpoint');
  });

  it('should get all issues', async () => {
    const mockRequest = {} as Request;
    const mockResponse = { 
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await getAllIssues(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith('getAllIssues endpoint');
  });

  it('should create a webhook endpoint', async () => {
    const mockRequest = {} as Request;
    const mockResponse = { 
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await createWebhookEndpoint(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith('createWebhookEndpoint endpoint');
  });

  it('should delete a webhook endpoint', async () => {
    const mockRequest = {} as Request;
    const mockResponse = { 
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await deleteWebhookEndpoint(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith('deleteWebhookEndpoint endpoint');
  });

  it('should link issues', async () => {
    const mockRequest = {} as Request;
    const mockResponse = { 
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await linkIssues(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith('linkIssues endpoint');
  });
});
