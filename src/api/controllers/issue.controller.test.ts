// src/api/controllers/issue.controller.test.ts
import { transitionIssue, getIssueTransitions, createIssue, getIssue, updateIssue, deleteIssue, listIssues, searchIssues, getIssuesByBoard, addAttachment, linkIssues, updateAssignee, getCreateIssueMetadata } from './issue.controller';
import * as issueService from '../services/issue.service';
import { Request, Response } from 'express';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

// Mock the issue service
vi.mock('../services/issue.service');

describe('Issue Controller - transitionIssue', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      params: {
        issueKey: 'ISSUE-123',
      },
      body: {
        transitionId: 'transition-456',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should transition an issue and return 204 status', async () => {
    (issueService.transitionIssue as Mock).mockResolvedValue(undefined);

    await transitionIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.transitionIssue).toHaveBeenCalledWith('ISSUE-123', 'transition-456');
    expect(mockResponse.status).toHaveBeenCalledWith(204);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  it('should return 400 status if issueKey is missing', async () => {
    mockRequest.params.issueKey = undefined;

    await transitionIssue(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
    expect(issueService.transitionIssue).not.toHaveBeenCalled();
  });

  it('should return 400 status if transitionId is missing', async () => {
    mockRequest.body.transitionId = undefined;

    await transitionIssue(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
    expect(issueService.transitionIssue).not.toHaveBeenCalled();
  });

  it('should return 500 status if an error occurs during transition', async () => {
    const errorMessage = 'Failed to transition issue';
    (issueService.transitionIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await transitionIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.transitionIssue).toHaveBeenCalledWith('ISSUE-123', 'transition-456');
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});

describe('Issue Controller - getIssueTransitions', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            params: {
                issueKey: 'ISSUE-123',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should get issue transitions and return 200 status with results', async () => {
        const mockTransitions = [{ id: '1', name: 'To Do' }, { id: '2', name: 'In Progress' }];
        (issueService.getIssueTransitions as Mock).mockResolvedValue(mockTransitions);

        await getIssueTransitions(mockRequest as Request, mockResponse as Response);

        expect(issueService.getIssueTransitions).toHaveBeenCalledWith('ISSUE-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockTransitions);
    });

    it('should return 400 status if issueKey is missing', async () => {
        mockRequest.params.issueKey = undefined;

        await getIssueTransitions(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.getIssueTransitions).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during getting transitions', async () => {
        const errorMessage = 'Failed to get transitions';
        (issueService.getIssueTransitions as Mock).mockRejectedValue(new Error(errorMessage));

        await getIssueTransitions(mockRequest as Request, mockResponse as Response);

        expect(issueService.getIssueTransitions).toHaveBeenCalledWith('ISSUE-123');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });

    it('should return 200 status with empty array if no transitions are found', async () => {
        (issueService.getIssueTransitions as Mock).mockResolvedValue([]);

        await getIssueTransitions(mockRequest as Request, mockResponse as Response);

        expect(issueService.getIssueTransitions).toHaveBeenCalledWith('ISSUE-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
});

describe('Issue Controller - createIssue', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            body: {
                title: 'Test Issue',
                description: 'Test Description',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create an issue and return 201 status with the issue', async () => {
        const mockIssue = { id: 'issue-123', title: 'Test Issue', description: 'Test Description' };
        (issueService.createIssue as Mock).mockResolvedValue(mockIssue);

        await createIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.createIssue).toHaveBeenCalledWith(mockRequest.body);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.body.title = ''; // Simulate a validation failure
        await createIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.createIssue).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during issue creation', async () => {
        const errorMessage = 'Failed to create issue';
        (issueService.createIssue as Mock).mockRejectedValue(new Error(errorMessage));

        await createIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.createIssue).toHaveBeenCalledWith(mockRequest.body);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - getIssue', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            params: {
                id: 'issue-123',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should get an issue and return 200 status with the issue', async () => {
        const mockIssue = { id: 'issue-123', title: 'Test Issue', description: 'Test Description' };
        (issueService.getIssue as Mock).mockResolvedValue(mockIssue);

        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.getIssue).toHaveBeenCalledWith('issue-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.params.id = 'invalid-id'; // Simulate a validation failure
        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.getIssue).not.toHaveBeenCalled();
    });

    it('should return 404 status if the issue is not found', async () => {
        (issueService.getIssue as Mock).mockResolvedValue(null);

        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.getIssue).toHaveBeenCalledWith('issue-123');
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
    });

    it('should return 500 status if an error occurs during getting the issue', async () => {
        const errorMessage = 'Failed to get issue';
        (issueService.getIssue as Mock).mockRejectedValue(new Error(errorMessage));

        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.getIssue).toHaveBeenCalledWith('issue-123');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - updateIssue', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            params: {
                id: 'issue-123',
            },
            body: {
                title: 'Updated Test Issue',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should update an issue and return 200 status with the updated issue', async () => {
        const mockIssue = { id: 'issue-123', title: 'Updated Test Issue', description: 'Test Description' };
        (issueService.updateIssue as Mock).mockResolvedValue(mockIssue);

        await updateIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.updateIssue).toHaveBeenCalledWith('issue-123', mockRequest.body);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.params.id = 'invalid-id'; // Simulate a validation failure
        await updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.updateIssue).not.toHaveBeenCalled();
    });

    it('should return 404 status if the issue is not found', async () => {
        (issueService.updateIssue as Mock).mockResolvedValue(null);

        await updateIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.updateIssue).toHaveBeenCalledWith('issue-123', mockRequest.body);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
    });

    it('should return 500 status if an error occurs during updating the issue', async () => {
        const errorMessage = 'Failed to update issue';
        (issueService.updateIssue as Mock).mockRejectedValue(new Error(errorMessage));

        await updateIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.updateIssue).toHaveBeenCalledWith('issue-123', mockRequest.body);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - deleteIssue', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            params: {
                id: 'issue-123',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should delete an issue and return 204 status', async () => {
        (issueService.deleteIssue as Mock).mockResolvedValue(undefined);

        await deleteIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.deleteIssue).toHaveBeenCalledWith('issue-123');
        expect(mockResponse.status).toHaveBeenCalledWith(204);
        expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.params.id = 'invalid-id'; // Simulate a validation failure
        await deleteIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.deleteIssue).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during deleting the issue', async () => {
        const errorMessage = 'Failed to delete issue';
        (issueService.deleteIssue as Mock).mockRejectedValue(new Error(errorMessage));

        await deleteIssue(mockRequest as Request, mockResponse as Response);

        expect(issueService.deleteIssue).toHaveBeenCalledWith('issue-123');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - listIssues', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should list issues and return 200 status with the issues', async () => {
        const mockIssues = [
            { id: 'issue-1', title: 'Test Issue 1', description: 'Description 1' },
            { id: 'issue-2', title: 'Test Issue 2', description: 'Description 2' },
        ];
        (issueService.listIssues as Mock).mockResolvedValue(mockIssues);

        await listIssues(mockRequest as Request, mockResponse as Response);

        expect(issueService.listIssues).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockIssues);
    });

    it('should return 500 status if an error occurs during listing issues', async () => {
        const errorMessage = 'Failed to list issues';
        (issueService.listIssues as Mock).mockRejectedValue(new Error(errorMessage));

        await listIssues(mockRequest as Request, mockResponse as Response);

        expect(issueService.listIssues).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - searchIssues', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            query: {
                query: 'test',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should search issues and return 200 status with the results', async () => {
        const mockResults = [
            { id: 'issue-1', title: 'Test Issue 1', description: 'Description 1' },
        ];
        (issueService.searchIssues as Mock).mockResolvedValue(mockResults);

        await searchIssues(mockRequest as Request, mockResponse as Response);

        expect(issueService.searchIssues).toHaveBeenCalledWith('test');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockResults);
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.query.query = 123; // Simulate a validation failure
        await searchIssues(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.searchIssues).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during searching issues', async () => {
        const errorMessage = 'Failed to search issues';
        (issueService.searchIssues as Mock).mockRejectedValue(new Error(errorMessage));

        await searchIssues(mockRequest as Request, mockResponse as Response);

        expect(issueService.searchIssues).toHaveBeenCalledWith('test');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - getIssuesByBoard', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            params: {
                boardId: 'board-123',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should get issues by board and return 200 status with the issues', async () => {
        const mockIssues = [
            { id: 'issue-1', title: 'Test Issue 1', description: 'Description 1' },
        ];
        (issueService.getIssuesByBoard as Mock).mockResolvedValue(mockIssues);

        await getIssuesByBoard(mockRequest as Request, mockResponse as Response);

        expect(issueService.getIssuesByBoard).toHaveBeenCalledWith('board-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockIssues);
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.params.boardId = 'invalid-board-id'; // Simulate a validation failure
        await getIssuesByBoard(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.getIssuesByBoard).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during getting issues by board', async () => {
        const errorMessage = 'Failed to get issues by board';
        (issueService.getIssuesByBoard as Mock).mockRejectedValue(new Error(errorMessage));

        await getIssuesByBoard(mockRequest as Request, mockResponse as Response);

        expect(issueService.getIssuesByBoard).toHaveBeenCalledWith('board-123');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - addAttachment', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            params: {
                issueKey: 'ISSUE-123',
            },
            files: {
                attachments: [{
                    path: '/tmp/file.txt'
                }]
            }
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should add an attachment and return 201 status', async () => {
        (issueService.addAttachment as Mock).mockResolvedValue(undefined);

        await addAttachment(mockRequest as Request, mockResponse as Response);

        expect(issueService.addAttachment).toHaveBeenCalledWith('ISSUE-123', ['/tmp/file.txt']);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Attachments added successfully' });
    });

    it('should return 400 status if no files are uploaded', async () => {
      mockRequest.files = {};

      await addAttachment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No files were uploaded.' });
      expect(issueService.addAttachment).not.toHaveBeenCalled();
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.params.issueKey = undefined; // Simulate a validation failure
        await addAttachment(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.addAttachment).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during adding attachment', async () => {
        const errorMessage = 'Failed to add attachment';
        (issueService.addAttachment as Mock).mockRejectedValue(new Error(errorMessage));

        await addAttachment(mockRequest as Request, mockResponse as Response);

        expect(issueService.addAttachment).toHaveBeenCalledWith('ISSUE-123', ['/tmp/file.txt']);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - linkIssues', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            body: {
                fromIssueKey: 'ISSUE-123',
                toIssueKey: 'ISSUE-456',
                linkType: 'relates',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should link issues and return 201 status', async () => {
        (issueService.linkIssues as Mock).mockResolvedValue(undefined);

        await linkIssues(mockRequest as Request, mockResponse as Response);

        expect(issueService.linkIssues).toHaveBeenCalledWith('ISSUE-123', 'ISSUE-456', 'relates');
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue linked successfully' });
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.body.fromIssueKey = undefined; // Simulate a validation failure
        await linkIssues(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.linkIssues).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during linking issues', async () => {
        const errorMessage = 'Failed to link issues';
        (issueService.linkIssues as Mock).mockRejectedValue(new Error(errorMessage));

        await linkIssues(mockRequest as Request, mockResponse as Response);

        expect(issueService.linkIssues).toHaveBeenCalledWith('ISSUE-123', 'ISSUE-456', 'relates');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - updateAssignee', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {
            params: {
                issueKey: 'ISSUE-123',
            },
            body: {
                assignee: 'user123',
            },
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should update assignee and return 200 status', async () => {
        (issueService.updateAssignee as Mock).mockResolvedValue(undefined);

        await updateAssignee(mockRequest as Request, mockResponse as Response);

        expect(issueService.updateAssignee).toHaveBeenCalledWith('ISSUE-123', 'user123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Assignee updated successfully' });
    });

    it('should return 400 status if validation fails', async () => {
        mockRequest.params.issueKey = undefined; // Simulate a validation failure
        await updateAssignee(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
        expect(issueService.updateAssignee).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during updating assignee', async () => {
        const errorMessage = 'Failed to update assignee';
        (issueService.updateAssignee as Mock).mockRejectedValue(new Error(errorMessage));

        await updateAssignee(mockRequest as Request, mockResponse as Response);

        expect(issueService.updateAssignee).toHaveBeenCalledWith('ISSUE-123', 'user123');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - getCreateIssueMetadata', () => {
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should get create issue metadata and return 200 status with the metadata', async () => {
        const mockMetadata = { fields: { summary: { type: 'string' } } };
        (issueService.getCreateIssueMetadata as Mock).mockResolvedValue(mockMetadata);

        await getCreateIssueMetadata(mockRequest as Request, mockResponse as Response);

        expect(issueService.getCreateIssueMetadata).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockMetadata);
    });

    it('should return 500 status if an error occurs during getting metadata', async () => {
        const errorMessage = 'Failed to get create issue metadata';
        (issueService.getCreateIssueMetadata as Mock).mockRejectedValue(new Error(errorMessage));

        await getCreateIssueMetadata(mockRequest as Request, mockResponse as Response);

        expect(issueService.getCreateIssueMetadata).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});
