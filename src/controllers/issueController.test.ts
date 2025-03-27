import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { getIssuesForBoard } from './issueController';
import * as issueService from '../services/issueService';
import express from 'express';

// Mock the express module
vi.mock('express', () => ({
  __esModule: true,
  json: vi.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
  Router: vi.fn(() => ({
    get: vi.fn()
  }))
}));

describe('issueController', () => {
  it('should return issues for a valid board ID', async () => {
    const mockBoardId = 'validBoardId';
    const mockIssues = [{ id: '1', title: 'Issue 1' }];
    vi.spyOn(issueService, 'getIssuesForBoard').mockResolvedValue(mockIssues);

    const mockRequest = { params: { boardId: mockBoardId } } as unknown as Request;
    const mockResponse = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

    await getIssuesForBoard(mockRequest, mockResponse, {} as NextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssues);
    expect(issueService.getIssuesForBoard).toHaveBeenCalledWith(mockBoardId);
  });

  it('should return a 404 for an invalid board ID', async () => {
    const mockBoardId = 'invalidBoardId';
    vi.spyOn(issueService, 'getIssuesForBoard').mockRejectedValue(new Error('Board not found'));

    const mockRequest = { params: { boardId: mockBoardId } } as unknown as Request;
    const mockResponse = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

    await getIssuesForBoard(mockRequest, mockResponse, {} as NextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Board not found' });
    expect(issueService.getIssuesForBoard).toHaveBeenCalledWith(mockBoardId);
  });
});