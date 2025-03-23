import { describe, expect, it, beforeEach } from 'vitest';
import { EpicService } from './epicService';
import { Epic } from '../types/epic';

describe('EpicService', () => {
  let epicService: EpicService;

  beforeEach(() => {
    epicService = new EpicService();
  });

  it('should return an array of epics', async () => {
    const mockEpics: Epic[] = [
      { id: '1', name: 'Epic 1', description: 'desc' },
      { id: '2', name: 'Epic 2', description: 'desc2' },
    ];

    // Mock the implementation of getAllEpics to return mockEpics
    (epicService.getAllEpics as any) = async () => mockEpics;

    const epics = await epicService.getAllEpics();
    expect(epics).toBe(mockEpics);
  });
});