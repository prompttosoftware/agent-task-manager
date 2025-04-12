import { Test, TestingModule } from '@nestjs/testing';
import { EpicController } from '../src/api/controllers/epic.controller';
import { EpicService } from '../src/api/services/epic.service';
import { EpicCreateRequest, EpicResponse, EpicListResponse, EpicUpdateRequest, EpicIssue } from '../src/api/types/epic.d';
import { HttpStatus } from '@nestjs/common';

// Mock the EpicService
jest.mock('../src/api/services/epic.service');

// Define mock data
const mockEpicResponse: EpicResponse = {
  key: 'EPIC-123',
  name: 'Test Epic',
  createdAt: new Date().toISOString(),
  self: 'http://example.com/epics/EPIC-123',
};

const mockEpicListResponse: EpicListResponse = [mockEpicResponse];

const mockEpicIssues: EpicIssue[] = [
  {
    id: '1',
    key: 'ISSUE-1',
    self: 'http://example.com/issues/ISSUE-1',
    fields: {
      summary: 'Test Issue',
      status: {
        name: 'Open',
        id: '1',
        statusCategory: { key: 'new' },
      },
      issuetype: {
        name: 'Story',
        iconUrl: 'http://example.com/story.png',
      },
    },
  },
];

describe('EpicController', () => {
  let controller: EpicController;
  let service: EpicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpicController],
      providers: [EpicService],
    }).compile();

    controller = module.get<EpicController>(EpicController);
    service = module.get<EpicService>(EpicService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEpic', () => {
    it('should create an epic successfully', async () => {
      const createEpicDto: EpicCreateRequest = {
        key: 'EPIC-456',
        name: 'New Epic',
      };
      (service.createEpic as jest.Mock).mockResolvedValue(mockEpicResponse);

      const result = await controller.createEpic(createEpicDto);
      expect(result).toEqual(mockEpicResponse);
      expect(service.createEpic).toHaveBeenCalledWith(createEpicDto);
    });

    it('should handle validation errors', async () => {
      const createEpicDto: EpicCreateRequest = {
        key: '', // Invalid - empty key
        name: '',
      };

      try {
        await controller.createEpic(createEpicDto);
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.BAD_REQUEST);
        expect(error.message).toContain('Validation failed');
      }
      expect(service.createEpic).not.toHaveBeenCalled();
    });

    it('should handle internal server errors', async () => {
      const createEpicDto: EpicCreateRequest = {
        key: 'EPIC-456',
        name: 'New Epic',
      };
      (service.createEpic as jest.Mock).mockRejectedValue(
        new Error('Internal server error'),
      );

      try {
        await controller.createEpic(createEpicDto);
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.message).toBe('Internal server error');
      }
      expect(service.createEpic).toHaveBeenCalledWith(createEpicDto);
    });
  });

  describe('listEpics', () => {
    it('should list epics successfully', async () => {
      (service.listEpics as jest.Mock).mockResolvedValue(mockEpicListResponse);

      const result = await controller.listEpics();
      expect(result).toEqual(mockEpicListResponse);
      expect(service.listEpics).toHaveBeenCalled();
    });

    it('should handle internal server errors', async () => {
      (service.listEpics as jest.Mock).mockRejectedValue(
        new Error('Internal server error'),
      );

      try {
        await controller.listEpics();
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.message).toBe('Internal server error');
      }
      expect(service.listEpics).toHaveBeenCalled();
    });
  });

  describe('getEpic', () => {
    it('should get an epic successfully', async () => {
      (service.getEpic as jest.Mock).mockResolvedValue(mockEpicResponse);

      const result = await controller.getEpic('EPIC-123');
      expect(result).toEqual(mockEpicResponse);
      expect(service.getEpic).toHaveBeenCalledWith('EPIC-123');
    });

    it('should return 404 if epic not found', async () => {
      (service.getEpic as jest.Mock).mockResolvedValue(undefined);

      try {
        await controller.getEpic('EPIC-NOT-FOUND');
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.NOT_FOUND);
        expect(error.message).toBe('Epic not found');
      }
      expect(service.getEpic).toHaveBeenCalledWith('EPIC-NOT-FOUND');
    });

    it('should handle internal server errors', async () => {
      (service.getEpic as jest.Mock).mockRejectedValue(
        new Error('Internal server error'),
      );

      try {
        await controller.getEpic('EPIC-123');
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.message).toBe('Internal server error');
      }
      expect(service.getEpic).toHaveBeenCalledWith('EPIC-123');
    });
  });

  describe('updateEpic', () => {
    it('should update an epic successfully', async () => {
      const updateEpicDto: EpicUpdateRequest = { name: 'Updated Epic' };
      const updatedEpic = { ...mockEpicResponse, name: 'Updated Epic' };
      (service.updateEpic as jest.Mock).mockResolvedValue(updatedEpic);

      const result = await controller.updateEpic('EPIC-123', updateEpicDto);
      expect(result).toEqual(updatedEpic);
      expect(service.updateEpic).toHaveBeenCalledWith('EPIC-123', updateEpicDto);
    });

    it('should handle validation errors', async () => {
      const updateEpicDto: EpicUpdateRequest = {
        key: '', // Invalid - empty key
        name: '',
      };

      try {
        await controller.updateEpic('EPIC-123', updateEpicDto);
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.BAD_REQUEST);
        expect(error.message).toContain('Validation failed');
      }
      expect(service.updateEpic).not.toHaveBeenCalled();
    });

    it('should return 404 if epic not found', async () => {
      const updateEpicDto: EpicUpdateRequest = { name: 'Updated Epic' };
      (service.updateEpic as jest.Mock).mockResolvedValue(undefined);

      try {
        await controller.updateEpic('EPIC-NOT-FOUND', updateEpicDto);
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.NOT_FOUND);
        expect(error.message).toBe('Epic not found');
      }
      expect(service.updateEpic).toHaveBeenCalledWith('EPIC-NOT-FOUND', updateEpicDto);
    });

    it('should handle internal server errors', async () => {
      const updateEpicDto: EpicUpdateRequest = { name: 'Updated Epic' };
      (service.updateEpic as jest.Mock).mockRejectedValue(
        new Error('Internal server error'),
      );

      try {
        await controller.updateEpic('EPIC-123', updateEpicDto);
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.message).toBe('Internal server error');
      }
      expect(service.updateEpic).toHaveBeenCalledWith('EPIC-123', updateEpicDto);
    });
  });

  describe('deleteEpic', () => {
    it('should delete an epic successfully', async () => {
      (service.deleteEpic as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteEpic('EPIC-123');
      expect(service.deleteEpic).toHaveBeenCalledWith('EPIC-123');
    });

    it('should handle internal server errors', async () => {
      (service.deleteEpic as jest.Mock).mockRejectedValue(
        new Error('Internal server error'),
      );

      try {
        await controller.deleteEpic('EPIC-123');
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.message).toBe('Internal server error');
      }
      expect(service.deleteEpic).toHaveBeenCalledWith('EPIC-123');
    });
  });

  describe('getIssuesForEpic', () => {
    it('should get issues for an epic successfully', async () => {
      (service.getIssuesForEpic as jest.Mock).mockResolvedValue(mockEpicIssues);

      const result = await controller.getIssuesForEpic('EPIC-123');
      expect(result).toEqual(mockEpicIssues);
      expect(service.getIssuesForEpic).toHaveBeenCalledWith('EPIC-123');
    });

    it('should handle internal server errors', async () => {
      (service.getIssuesForEpic as jest.Mock).mockRejectedValue(
        new Error('Internal server error'),
      );

      try {
        await controller.getIssuesForEpic('EPIC-123');
      } catch (error: any) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.message).toBe('Internal server error');
      }
      expect(service.getIssuesForEpic).toHaveBeenCalledWith('EPIC-123');
    });
  });
});