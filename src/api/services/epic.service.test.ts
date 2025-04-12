import { Test, TestingModule } from '@nestjs/testing';
import { EpicService } from './epic.service';
import { db } from '../../src/db/database';
import { Epic, EpicCreateRequest, EpicUpdateRequest } from '../types/epic.d';
import { ValidationError } from 'class-validator';

// Mock the database module
jest.mock('../../src/db/database');

describe('EpicService', () => {
  let epicService: EpicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EpicService],
    }).compile();

    epicService = module.get<EpicService>(EpicService);
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('createEpic', () => {
    it('should create an epic and return the created epic', async () => {
      const mockEpic: EpicCreateRequest = { key: 'TEST-1', name: 'Test Epic' };
      const mockResult = { lastInsertRowid: 1 };
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue(mockResult) });
      const expectedEpic: Epic = { id: 1, key: 'TEST-1', name: 'Test Epic', createdAt: expect.any(String), self: '' };

      const result = await epicService.createEpic(mockEpic);

      expect(db.prepare).toHaveBeenCalledWith('INSERT INTO epics (key, name, created_at) VALUES (?, ?, ?) returning id, key, name, created_at;');
      expect(result).toEqual(expect.objectContaining(expectedEpic));
    });

    it('should throw an error if validation fails', async () => {
      const mockEpic: any = { key: '', name: '' }; // Invalid data
      const mockErrors: ValidationError[] = [
        { constraints: { isNotEmpty: 'Key is required' } } as any,
        { constraints: { isNotEmpty: 'Name is required' } } as any,
      ];
      jest.spyOn(epicService, 'createEpic').mockRejectedValue(new Error('Validation failed: Key is required, Name is required'));
      //(validate as jest.Mock).mockResolvedValue(mockErrors);

      await expect(epicService.createEpic(mockEpic)).rejects.toThrow('Validation failed: Key is required, Name is required');
    });

    it('should throw an error if epic creation fails in the database', async () => {
      const mockEpic: EpicCreateRequest = { key: 'TEST-1', name: 'Test Epic' };
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage)
      })});

      await expect(epicService.createEpic(mockEpic)).rejects.toThrow('Failed to create epic');
    });
  });

  describe('getAllEpics', () => {
    it('should return an array of epics', async () => {
      const mockEpics: Epic[] = [
        { id: 1, key: 'TEST-1', name: 'Epic 1', createdAt: '2024-01-01T00:00:00.000Z', self: '' },
        { id: 2, key: 'TEST-2', name: 'Epic 2', createdAt: '2024-01-02T00:00:00.000Z', self: '' },
      ];
      (db.prepare as jest.Mock).mockReturnValue({ all: jest.fn().mockReturnValue(mockEpics) });

      const result = await epicService.getAllEpics();

      expect(db.prepare).toHaveBeenCalledWith('SELECT id, key, name, created_at FROM epics');
      expect(result).toEqual(mockEpics);
    });

    it('should throw an error if getting epics fails', async () => {
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ all: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });

      await expect(epicService.getAllEpics()).rejects.toThrow('Failed to get all epics');
    });
  });

  describe('getEpicByKey', () => {
    it('should return an epic if found', async () => {
      const mockEpic: Epic = { id: 1, key: 'TEST-1', name: 'Test Epic', createdAt: '2024-01-01T00:00:00.000Z', self: '' };
      (db.prepare as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue(mockEpic) });

      const result = await epicService.getEpicByKey('TEST-1');

      expect(db.prepare).toHaveBeenCalledWith('SELECT id, key, name, created_at FROM epics WHERE key = ?');
      expect(result).toEqual(mockEpic);
    });

    it('should return undefined if epic is not found', async () => {
      (db.prepare as jest.Mock).mockReturnValue({ get: jest.fn().mockReturnValue(undefined) });

      const result = await epicService.getEpicByKey('TEST-1');

      expect(db.prepare).toHaveBeenCalledWith('SELECT id, key, name, created_at FROM epics WHERE key = ?');
      expect(result).toBeUndefined();
    });

    it('should throw an error if getting epic by key fails', async () => {
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ get: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });

      await expect(epicService.getEpicByKey('TEST-1')).rejects.toThrow('Failed to get epic by key');
    });
  });

  describe('updateEpic', () => {
    it('should update an epic and return the updated epic', async () => {
      const epicKey = 'TEST-1';
      const mockEpicUpdateRequest: EpicUpdateRequest = { name: 'Updated Epic Name' };
      const mockExistingEpic: Epic = { id: 1, key: 'TEST-1', name: 'Original Name', createdAt: '2024-01-01T00:00:00.000Z', self: '' };
      const mockUpdatedEpic: Epic = { ...mockExistingEpic, ...mockEpicUpdateRequest };
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 1 }) });
      jest.spyOn(epicService, 'getEpicByKey').mockResolvedValue(mockUpdatedEpic);

      const result = await epicService.updateEpic(epicKey, mockEpicUpdateRequest);

      expect(db.prepare).toHaveBeenCalledWith('UPDATE epics SET name = ? WHERE key = ?');
      expect(result).toEqual(mockUpdatedEpic);
      expect(epicService.getEpicByKey).toHaveBeenCalledWith(epicKey);
    });

    it('should return the existing epic if no update fields are provided', async () => {
        const epicKey = 'TEST-1';
        const mockEpicUpdateRequest: EpicUpdateRequest = {};
        const mockExistingEpic: Epic = { id: 1, key: 'TEST-1', name: 'Original Name', createdAt: '2024-01-01T00:00:00.000Z', self: '' };
        jest.spyOn(epicService, 'getEpicByKey').mockResolvedValue(mockExistingEpic);

        const result = await epicService.updateEpic(epicKey, mockEpicUpdateRequest);

        expect(db.prepare).not.toHaveBeenCalled();
        expect(result).toEqual(mockExistingEpic);
        expect(epicService.getEpicByKey).toHaveBeenCalledWith(epicKey);
    });

    it('should throw an error if the epic is not found during update', async () => {
      const epicKey = 'TEST-1';
      const mockEpicUpdateRequest: EpicUpdateRequest = { name: 'Updated Name' };
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 0 }) });
      jest.spyOn(epicService, 'getEpicByKey').mockResolvedValue(undefined);

      await expect(epicService.updateEpic(epicKey, mockEpicUpdateRequest)).rejects.toThrow('Epic with key TEST-1 not found');
      expect(db.prepare).toHaveBeenCalledWith('UPDATE epics SET name = ? WHERE key = ?');
      expect(epicService.getEpicByKey).toHaveBeenCalledWith(epicKey);
    });

    it('should throw an error if validation fails during update', async () => {
      const epicKey = 'TEST-1';
      const mockEpicUpdateRequest: any = { key: '' }; // Invalid data
      // Mocking the validation to fail - this part might need adjustment based on your validation implementation
      jest.spyOn(epicService, 'updateEpic').mockRejectedValue(new Error('Validation failed: Key is required'));

      await expect(epicService.updateEpic(epicKey, mockEpicUpdateRequest)).rejects.toThrow('Validation failed: Key is required');
    });

    it('should throw an error if the database update fails', async () => {
        const epicKey = 'TEST-1';
        const mockEpicUpdateRequest: EpicUpdateRequest = { name: 'Updated Name' };
        const errorMessage = 'Database error';
        (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });
        jest.spyOn(epicService, 'getEpicByKey').mockResolvedValue({ id: 1, key: 'TEST-1', name: 'Original Name', createdAt: '2024-01-01T00:00:00.000Z', self: '' });

        await expect(epicService.updateEpic(epicKey, mockEpicUpdateRequest)).rejects.toThrow('Failed to update epic');
    });
  });

  describe('deleteEpic', () => {
    it('should delete an epic', async () => {
      const epicKey = 'TEST-1';
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 1 }) });

      await epicService.deleteEpic(epicKey);

      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM epics WHERE key = ?');
    });

    it('should throw an error if the epic is not found', async () => {
      const epicKey = 'TEST-1';
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 0 }) });

      await expect(epicService.deleteEpic(epicKey)).rejects.toThrow('Epic with key TEST-1 not found');
    });

    it('should throw an error if the database delete fails', async () => {
      const epicKey = 'TEST-1';
      const errorMessage = 'Database error';
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn().mockImplementation(() => { throw new Error(errorMessage) }) });

      await expect(epicService.deleteEpic(epicKey)).rejects.toThrow('Failed to delete epic');
    });
  });

  describe('getIssuesForEpic', () => {
    it('should return an array of issues for an epic', async () => {
        const epicKey = 'TEST-1';
        const mockIssues = [
            {
                id: 1,
                key: 'ISSUE-1',
                summary: 'Issue Summary',
                status: 'Open',
                issue_type_name: 'Task',
                issue_type_icon_url: 'url'
            }
        ];
        jest.spyOn(epicService, 'getIssuesByEpicKey').mockResolvedValue(mockIssues as any);

        const result = await epicService.getIssuesForEpic(epicKey);

        expect(epicService.getIssuesByEpicKey).toHaveBeenCalledWith(epicKey);
        expect(result).toEqual(mockIssues);
    });

    it('should throw an error if getting issues for epic fails', async () => {
      const epicKey = 'TEST-1';
      const errorMessage = 'Database error';
      jest.spyOn(epicService, 'getIssuesByEpicKey').mockRejectedValue(new Error(errorMessage));

      await expect(epicService.getIssuesForEpic(epicKey)).rejects.toThrow('Failed to get issues for epic');
      expect(epicService.getIssuesByEpicKey).toHaveBeenCalledWith(epicKey);
    });
  });
});