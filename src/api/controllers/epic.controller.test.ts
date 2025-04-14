import { Request, Response } from 'express';
import { EpicController } from './epic.controller';
import { EpicService } from '../services/epic.service';
import { validationResult } from 'express-validator';
import { Epic } from '../types/epic.d';
import { NotFoundException } from '@nestjs/common';

// Mock express validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('EpicController', () => {
  let epicController: EpicController;
  let epicService: EpicService;
  let req: Request;
  let res: Response;

  beforeEach(() => {
    epicService = {  // Mock the EpicService
      getEpic: jest.fn(),
      listEpics: jest.fn(),
      createEpic: jest.fn(),
      updateEpic: jest.fn(),
      deleteEpic: jest.fn(),
    } as unknown as EpicService;
    epicController = new EpicController(epicService);

    // Mock Express Request and Response objects
    req = {  
      params: {},
      body: {},
    } as Request;

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response; // Type assertion to allow chaining
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEpic', () => {
    it('should return 200 with the epic data when found', async () => {
      const epicKey = 'EPIC-1';
      const mockEpic: Epic = {
        key: epicKey,
        name: 'Test Epic',
        description: 'Test Description',
        status: 'TODO',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      (epicService.getEpic as jest.Mock).mockResolvedValue(mockEpic);
      req.params = { epicKey };

      await epicController.getEpic(req, res);

      expect(epicService.getEpic).toHaveBeenCalledWith(epicKey);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockEpic);
    });

    it('should return 404 when epic is not found', async () => {
      const epicKey = 'EPIC-1';
      (epicService.getEpic as jest.Mock).mockResolvedValue(undefined);
      req.params = { epicKey };

      await epicController.getEpic(req, res);

      expect(epicService.getEpic).toHaveBeenCalledWith(epicKey);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Epic not found' });
    });

    it('should return 500 on service error', async () => {
      const epicKey = 'EPIC-1';
      const errorMessage = 'Service unavailable';
      (epicService.getEpic as jest.Mock).mockRejectedValue(new Error(errorMessage));
      req.params = { epicKey };

      await epicController.getEpic(req, res);

      expect(epicService.getEpic).toHaveBeenCalledWith(epicKey);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('listEpics', () => {
    it('should return 200 with an array of epics', async () => {
      const mockEpics: Epic[] = [
        {
          key: 'EPIC-1',
          name: 'Epic 1',
          description: 'Desc 1',
          status: 'TODO',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        {
          key: 'EPIC-2',
          name: 'Epic 2',
          description: 'Desc 2',
          status: 'IN_PROGRESS',
          startDate: '2024-02-01',
          endDate: '2024-02-29',
        },
      ];
      (epicService.listEpics as jest.Mock).mockResolvedValue(mockEpics);

      await epicController.listEpics(req, res);

      expect(epicService.listEpics).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockEpics);
    });

    it('should return 500 on service error', async () => {
      const errorMessage = 'Failed to list epics';
      (epicService.listEpics as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await epicController.listEpics(req, res);

      expect(epicService.listEpics).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('createEpic', () => {
    it('should return 201 with the created epic on success', async () => {
      const mockNewEpic: Epic = {
        key: 'EPIC-3',
        name: 'New Epic',
        description: 'New Desc',
        status: 'TODO',
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      };
      (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });
      (epicService.createEpic as jest.Mock).mockResolvedValue(mockNewEpic);
      req.body = mockNewEpic;

      await epicController.createEpic(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(epicService.createEpic).toHaveBeenCalledWith(mockNewEpic);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNewEpic);
    });

    it('should return 400 if validation fails', async () => {
      const mockErrors = [{ msg: 'Name is required' }];
      (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => false, array: () => mockErrors });

      await epicController.createEpic(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(epicService.createEpic).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
    });

    it('should return 400 on service error', async () => {
      const errorMessage = 'Invalid epic data';
      (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });
      (epicService.createEpic as jest.Mock).mockRejectedValue(new Error(errorMessage));
      req.body = {
        key: 'EPIC-3',
        name: 'New Epic',
        description: 'New Desc',
        status: 'TODO',
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      };

      await epicController.createEpic(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(epicService.createEpic).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('updateEpic', () => {
    it('should return 200 with the updated epic on success', async () => {
      const epicKey = 'EPIC-1';
      const mockUpdatedEpic: Epic = {
        key: epicKey,
        name: 'Updated Epic',
        description: 'Updated Desc',
        status: 'DONE',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };
      (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });
      (epicService.updateEpic as jest.Mock).mockResolvedValue(mockUpdatedEpic);
      req.params = { epicKey };
      req.body = {
        name: 'Updated Epic',
        description: 'Updated Desc',
        status: 'DONE',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      await epicController.updateEpic(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(epicService.updateEpic).toHaveBeenCalledWith(epicKey, req.body);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedEpic);
    });

    it('should return 404 if epic is not found', async () => {
      const epicKey = 'EPIC-1';
      (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });
      (epicService.updateEpic as jest.Mock).mockResolvedValue(undefined);
      req.params = { epicKey };
      req.body = {
        name: 'Updated Epic',
      };

      await epicController.updateEpic(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(epicService.updateEpic).toHaveBeenCalledWith(epicKey, req.body);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Epic not found' });
    });

    it('should return 400 if validation fails', async () => {
      const mockErrors = [{ msg: 'Name is required' }];
      (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => false, array: () => mockErrors });
      req.params = { epicKey: 'EPIC-1' };

      await epicController.updateEpic(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(epicService.updateEpic).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
    });

    it('should return 500 on service error', async () => {
      const epicKey = 'EPIC-1';
      const errorMessage = 'Failed to update epic';
      (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });
      (epicService.updateEpic as jest.Mock).mockRejectedValue(new Error(errorMessage));
      req.params = { epicKey };
      req.body = {
        name: 'Updated Epic',
      };

      await epicController.updateEpic(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(epicService.updateEpic).toHaveBeenCalledWith(epicKey, req.body);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('deleteEpic', () => {
    it('should return 204 on successful deletion', async () => {
      const epicKey = 'EPIC-1';
      (epicService.deleteEpic as jest.Mock).mockResolvedValue(undefined);
      req.params = { epicKey };

      await epicController.deleteEpic(req, res);

      expect(epicService.deleteEpic).toHaveBeenCalledWith(epicKey);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      const epicKey = 'EPIC-1';
      const errorMessage = 'Failed to delete epic';
      (epicService.deleteEpic as jest.Mock).mockRejectedValue(new Error(errorMessage));
      req.params = { epicKey };

      await epicController.deleteEpic(req, res);

      expect(epicService.deleteEpic).toHaveBeenCalledWith(epicKey);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
