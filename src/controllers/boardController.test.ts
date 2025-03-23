// src/controllers/boardController.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getIssuesForBoardController, listBoardsController } from './boardController';
import * as boardService from '../services/boardService';

// Mock the boardService dependencies if needed

describe('boardController', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    // Mock the boardService
    vi.spyOn(boardService, 'getIssuesForBoardService').mockResolvedValue([]);
    vi.spyOn(boardService, 'listBoardsService').mockResolvedValue([]);
  });

  it('should get issues for a specific board', async () => {
    // Arrange
    const mockRequest = { params: { boardId: '123' } } as unknown as Request;
    const mockResponse = { json: vi.fn(), status: vi.fn().mockReturnThis() } as unknown as Response;

    // Act
    await getIssuesForBoardController(mockRequest, mockResponse);

    // Assert
    expect(boardService.getIssuesForBoardService).toHaveBeenCalledWith('123');
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should list all boards', async () => {
    // Arrange
    const mockRequest = {} as Request;
    const mockResponse = { json: vi.fn(), status: vi.fn().mockReturnThis() } as unknown as Response;

    // Act
    await listBoardsController(mockRequest, mockResponse);

    // Assert
    expect(boardService.listBoardsService).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should handle errors when getting issues', async () => {
    // Arrange
    const mockRequest = { params: { boardId: '123' } } as unknown as Request;
    const mockResponse = { json: vi.fn(), status: vi.fn().mockReturnThis() } as unknown as Response;
    vi.spyOn(boardService, 'getIssuesForBoardService').mockRejectedValue(new Error('Test error'));

    // Act
    await getIssuesForBoardController(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

  it('should handle errors when listing boards', async () => {
    // Arrange
    const mockRequest = {} as Request;
    const mockResponse = { json: vi.fn(), status: vi.fn().mockReturnThis() } as unknown as Response;
    vi.spyOn(boardService, 'listBoardsService').mockRejectedValue(new Error('Test error'));

    // Act
    await listBoardsController(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});