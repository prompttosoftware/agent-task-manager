import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { listBoardsController } from './boardController';
import * as boardService from '../services/boardService';

// Mock the express module correctly
const mockStatus = vi.fn().mockReturnThis();
const mockJson = vi.fn();

vi.mock('express', () => ({
  __esModule: true,
  json: mockJson,
  status: vi.fn(() => ({
    json: mockJson,
    send: vi.fn()
  }))
}));

describe('boardController', () => {
  it('should return a list of boards on success', async () => {
    const mockBoards = [{ id: 1, name: 'Board 1' }, { id: 2, name: 'Board 2' }];
    vi.spyOn(boardService, 'listBoardsService').mockResolvedValue(mockBoards);

    const mockRequest = {} as Request;
    const mockResponse = { status: mockStatus, json: mockJson } as unknown as Response;

    await listBoardsController(mockRequest, mockResponse, {} as NextFunction);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(mockBoards);
    expect(boardService.listBoardsService).toHaveBeenCalled();
  });

  it('should return 500 on error', async () => {
    const errorMessage = 'Failed to list boards';
    vi.spyOn(boardService, 'listBoardsService').mockRejectedValue(new Error(errorMessage));

    const mockRequest = {} as Request;
    const mockResponse = { status: mockStatus, json: mockJson } as unknown as Response;

    await listBoardsController(mockRequest, mockResponse, {} as NextFunction);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ message: errorMessage });
    expect(boardService.listBoardsService).toHaveBeenCalled();
  });
});