import { createIssue, getIssue, updateIssue, deleteIssue, getAllIssues, createWebhookEndpoint, deleteWebhookEndpoint, linkIssues } from './issueController';
import { Request, Response, NextFunction } from 'express';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { issueKeyService } from '../../services/issueKeyService';
import { databaseService } from '../../services/databaseService';
import { webhookService } from '../../services/webhookService';

// Mock the db module
jest.mock('../../config/db', () => ({
    getDBConnection: jest.fn()
}));

jest.mock('../../services/issueKeyService');
jest.mock('../../services/databaseService');
jest.mock('../../services/webhookService');

describe('IssueController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create an issue with valid data', async () => {
    const mockRequest = {
      body: { summary: 'Test Summary', description: 'Test Description' },
    } as Request;
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    (issueKeyService.generateIssueKey as jest.Mock).mockResolvedValue('ATM-123');
    (databaseService.createIssue as jest.Mock).mockResolvedValue({ key: 'ATM-123', summary: 'Test Summary', description: 'Test Description', statusId: 11 });
    (webhookService.triggerIssueCreated as jest.Mock).mockResolvedValue(undefined);

    await createIssue(mockRequest, mockResponse, mockNext);

    expect(issueKeyService.generateIssueKey).toHaveBeenCalled();
    expect(databaseService.createIssue).toHaveBeenCalledWith({
      key: 'ATM-123',
      summary: 'Test Summary',
      description: 'Test Description',
      statusId: 11,
    });
    expect(webhookService.triggerIssueCreated).toHaveBeenCalledWith({ key: 'ATM-123', summary: 'Test Summary', description: 'Test Description', statusId: 11 });
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({ key: 'ATM-123', summary: 'Test Summary', description: 'Test Description', statusId: 11 });
  });

  it('should return 400 for invalid request body', async () => {
    const mockRequest = {
      body: {},
    } as Request;
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    await createIssue(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid request body.  Must include a summary.' });
  });

  it('should handle database errors', async () => {
    const mockRequest = {
      body: { summary: 'Test Summary' },
    } as Request;
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    (issueKeyService.generateIssueKey as jest.Mock).mockRejectedValue(new Error('Database error'));

    await createIssue(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to create issue' });
  });

  it('should handle database constraint violation', async () => {
    const mockRequest = {
      body: { summary: 'Test Summary' },
    } as Request;
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn() as NextFunction;

    const constraintError = new Error('SQLITE_CONSTRAINT');
    (issueKeyService.generateIssueKey as jest.Mock).mockRejectedValue(constraintError);

    await createIssue(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to create issue' });
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