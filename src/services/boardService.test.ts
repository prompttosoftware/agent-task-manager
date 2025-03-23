// src/services/boardService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIssuesForBoardService, listBoardsService, Board } from './boardService';

// Mock the boardService dependencies if needed

describe('boardService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  it('should get issues for a specific board', async () => {
    // Arrange
    const boardId = '123';
    const expectedIssues = [
      { id: '1', boardId: '123', name: 'Task 1', description: 'Description 1' },
      { id: '2', boardId: '123', name: 'Task 2', description: 'Description 2' },
    ];
    // Mock the underlying data or dependencies if they are external to the service.
    // In this case the data is internal.

    // Act
    const issues = await getIssuesForBoardService(boardId);

    // Assert
    expect(issues).toEqual(expect.arrayContaining(expectedIssues));
  });

  it('should list all boards', async () => {
    // Arrange
    const expectedBoards: Board[] = [
      {
        id: '123',
        name: 'Board 1',
        statuses: [
          { id: '1', name: 'To Do' },
          { id: '2', name: 'In Progress' },
          { id: '3', name: 'Done' },
        ],
      },
      {
        id: '456',
        name: 'Board 2',
        statuses: [
          { id: '1', name: 'Backlog' },
          { id: '2', name: 'In Progress' },
          { id: '3', name: 'Review' },
          { id: '4', name: 'Approved' },
        ],
      },
    ];

    // Act
    const boards = await listBoardsService();

    // Assert
    expect(boards).toEqual(expect.arrayContaining(expectedBoards));
  });
});