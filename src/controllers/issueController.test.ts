import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { getIssuesForBoardController } from './issueController';
import * as issueService from '../services/issueService';
import express, { Router } from 'express';

// Mock the express module correctly
vi.mock('express', () => {
  const actual = vi.importActual('express');
  return {
    __esModule: true,
    ...actual,
    json: vi.fn().mockImplementation((data: any) => data),
    status: vi.fn().mockImplementation(() => ({ json: vi.fn() })),
    Router: vi.fn(() => ({
      get: vi.fn(),
    })),
  };
});

describe('issueController', () => {
  it('should return issues for a valid board ID', async () => {
    const mockBoardId = 'validBoardId';
    const mockIssues = [{ id: '1', title: 'Issue 1' }];
    vi.spyOn(issueService, 'getIssuesForBoardService').mockResolvedValue(mockIssues);

    const mockRequest = { params: { boardId: mockBoardId } } as unknown as Request;
    const mockResponse = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

    await getIssuesForBoardController(mockRequest, mockResponse, {} as NextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssues);
    expect(issueService.getIssuesForBoardService).toHaveBeenCalledWith(mockBoardId);
  });

  it('should return a 404 for an invalid board ID', async () => {
    const mockBoardId = 'invalidBoardId';
    const errorMessage = 'Board not found';
    vi.spyOn(issueService, 'getIssuesForBoardService').mockRejectedValue(new Error(errorMessage));

    const mockRequest = { params: { boardId: mockBoardId } } as unknown as Request;
    const mockResponse = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

    await getIssuesForBoardController(mockRequest, mockResponse, {} as NextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: errorMessage });
    expect(issueService.getIssuesForBoardService).toHaveBeenCalledWith(mockBoardId);
  });
});