import { describe, expect, it, beforeEach, vi } from 'vitest';
import { EpicController } from './epicController';
import { EpicService } from '../services/epicService';
import { Request, Response } from 'express';

describe('EpicController', () => {
  let epicController: EpicController;
  let mockEpicService: any;
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    mockEpicService = {
      getAllEpics: vi.fn(),
    };
    epicController = new EpicController(mockEpicService);
    mockRequest = {} as Request;
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
  });

  it('should get all epics', async () => {
    const mockEpics = [{ id: '1', name: 'Epic 1' }];
    mockEpicService.getAllEpics.mockResolvedValue(mockEpics);

    await epicController.getEpics(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      epics: [
        {
          id: '1',
          name: 'Epic 1',
        },
      ],
    });
  });
});