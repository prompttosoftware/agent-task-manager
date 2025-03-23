// src/services/boardService.ts

interface Issue {
  id: string;
  boardId: string;
  name: string;
  description?: string;
}

export interface Board {
    id: string;
    name: string;
    statuses: {
        id: string;
        name: string;
    }[];
}

// In-memory storage (replace with database in real app)
const issues: Issue[] = [
  { id: '1', boardId: '123', name: 'Task 1', description: 'Description 1' },
  { id: '2', boardId: '123', name: 'Task 2', description: 'Description 2' },
  { id: '3', boardId: '456', name: 'Task 3', description: 'Description 3' },
];

const boards: Board[] = [
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

export const getIssuesForBoardService = async (boardId: string) => {
  // Simulate an API call or database query
  const filteredIssues = issues.filter((issue) => issue.boardId === boardId);
  return filteredIssues;
};

export const listBoardsService = async (): Promise<Board[]> => {
    // Simulate fetching boards from a database
    return boards;
};
