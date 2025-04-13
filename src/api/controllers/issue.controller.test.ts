// src/api/controllers/issue.controller.test.ts
import { Request, Response } from 'express';
import { IssueController } from './issue.controller';
import { IssueService } from '../services/issue.service';
import { BoardService } from '../services/board.service';
import { Issue } from '../types/issue';
import multer from 'multer';
import { describe, it, expect, beforeEach, vi, Mock, afterEach } from 'vitest';
import { validationResult } from 'express-validator';
import { MulterError } from 'multer';

// Mock the IssueService
vi.mock('../services/issue.service');
const mockIssueService = { // Use an object for the mock
    searchIssues: vi.fn(),
    getIssue: vi.fn(),
    getIssuesByBoard: vi.fn(),
    addIssue: vi.fn(),
    updateIssue: vi.fn(),
    deleteIssue: vi.fn(),
    addAttachment: vi.fn(),
    linkIssue: vi.fn(),
    assignIssue: vi.fn(),
    transitionIssue: vi.fn(),
    getCreateMeta: vi.fn(),
    getTransitions: vi.fn()
} as unknown as jest.Mocked<IssueService>;

// Mock the BoardService
vi.mock('../services/board.service');
const mockBoardService = { } as jest.Mocked<BoardService>;

// Mock validationResult
vi.mock('express-validator', () => {
    const actual = vi.importActual('express-validator');
    return {
        ...actual,
        validationResult: vi.fn().mockReturnValue({ // Corrected: mockReturnValue
            isEmpty: vi.fn(),
            array: vi.fn()
        }),
    };
});

// Mock multer
vi.mock('multer', () => {
    const actual = vi.importActual('multer');
    const mockMulter = {
        ...actual,
        // Use mockImplementation instead of mockReturnValue
        single: vi.fn().mockImplementation((fieldName: string) => {
            return (req: Request, res: Response, next: Function) => {
                const mockFile = req.file;
                if (mockFile === undefined) {
                    next(); // Simulate no file
                }
                next(); // Simulate success
            };
        }),
        MulterError: actual.MulterError,
    };
    return mockMulter;
});


describe('IssueController', () => {
    let issueController: IssueController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>
    let mockJson: Mock;
    let mockSend: Mock;
    let mockStatus: Mock;
    let mockValidationResult: Mock;

    beforeEach(() => {
        issueController = new IssueController(mockIssueService as any, mockBoardService);
        mockJson = vi.fn();
        mockSend = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson, send: mockSend });
        mockValidationResult = (validationResult as any) as Mock;

        mockRequest = {};
        mockResponse = {
            status: mockStatus,
            json: mockJson,
            send: mockSend,
        } as unknown as Response;

        vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('searchIssues', () => {
        it('should return 200 with search results on success', async () => {
            const mockIssues: Issue[] = [{ issueKey: 'TEST-1', summary: 'Test Issue', description: 'Test Description', issueType: 'Task', boardId: '1', assignee: 'user1' }];
            mockIssueService.searchIssues.mockResolvedValue(mockIssues);
            mockRequest.query = { query: 'test' };

            await issueController.searchIssues(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.searchIssues).toHaveBeenCalledWith('test');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockIssues);
        });

        it('should return 400 if query parameter is missing', async () => {
            mockRequest.query = {};

            await issueController.searchIssues(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Query parameter is required and must be a string' });
        });

        it('should return 500 if an error occurs during search', async () => {
            mockIssueService.searchIssues.mockRejectedValue(new Error('Search failed'));
            mockRequest.query = { query: 'test' };

            await issueController.searchIssues(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Search failed' });
        });
    });

    describe('getIssue', () => {
        it('should return 200 with the issue on success', async () => {
            const mockIssue: Issue = { issueKey: 'TEST-1', summary: 'Test Issue', description: 'Test Description', issueType: 'Task', boardId: '1', assignee: 'user1' };
            mockIssueService.getIssue.mockResolvedValue(mockIssue);
            mockRequest.params = { issueKey: 'TEST-1' };

            await issueController.getIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.getIssue).toHaveBeenCalledWith('TEST-1');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 404 if the issue is not found', async () => {
            mockIssueService.getIssue.mockResolvedValue(undefined);
            mockRequest.params = { issueKey: 'TEST-1' };

            await issueController.getIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.getIssue).toHaveBeenCalledWith('TEST-1');
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Issue not found' });
        });

        it('should return 500 if an error occurs while getting the issue', async () => {
            mockIssueService.getIssue.mockRejectedValue(new Error('Failed to get issue'));
            mockRequest.params = { issueKey: 'TEST-1' };

            await issueController.getIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get issue' });
        });
    });

    describe('getIssuesByBoard', () => {
        it('should return 200 with issues on success', async () => {
            const mockIssues: Issue[] = [{ issueKey: 'TEST-1', summary: 'Test Issue', description: 'Test Description', issueType: 'Task', boardId: '1', assignee: 'user1' }];
            mockIssueService.getIssuesByBoard.mockResolvedValue(mockIssues);
            mockRequest.params = { boardId: '1' };

            await issueController.getIssuesByBoard(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.getIssuesByBoard).toHaveBeenCalledWith('1');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockIssues);
        });

        it('should return 500 if an error occurs while getting issues by board', async () => {
            mockIssueService.getIssuesByBoard.mockRejectedValue(new Error('Failed to get issues'));
            mockRequest.params = { boardId: '1' };

            await issueController.getIssuesByBoard(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get issues' });
        });
    });

    describe('addIssue', () => {
        it('should return 201 with the new issue on success', async () => {
            const mockIssue: Issue = { issueKey: 'TEST-1', summary: 'Test Issue', description: 'Test Description', issueType: 'Task', boardId: '1', assignee: 'user1' };
            mockIssueService.addIssue.mockResolvedValue(mockIssue);
            mockRequest.body = mockIssue;
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.addIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.addIssue).toHaveBeenCalledWith(mockIssue);
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 400 if validation fails', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Summary is required' }] });
            mockRequest.body = {};

            await issueController.addIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Summary is required' }] });
        });

        it('should return 500 if an error occurs while adding the issue', async () => {
            const mockIssue: Issue = { issueKey: 'TEST-1', summary: 'Test Issue', description: 'Test Description', issueType: 'Task', boardId: '1', assignee: 'user1' };
            mockIssueService.addIssue.mockRejectedValue(new Error('Failed to add issue'));
            mockRequest.body = mockIssue;
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.addIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to add issue' });
        });
    });

    describe('updateIssue', () => {
        it('should return 200 with the updated issue on success', async () => {
            const mockIssue: Issue = { issueKey: 'TEST-1', summary: 'Updated Issue', description: 'Test Description', issueType: 'Task', boardId: '1', assignee: 'user1' };
            mockIssueService.updateIssue.mockResolvedValue(mockIssue);
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { summary: 'Updated Issue' };

            await issueController.updateIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.updateIssue).toHaveBeenCalledWith('TEST-1', { summary: 'Updated Issue' });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 404 if the issue is not found', async () => {
            mockIssueService.updateIssue.mockResolvedValue(undefined);
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { summary: 'Updated Issue' };

            await issueController.updateIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.updateIssue).toHaveBeenCalledWith('TEST-1', { summary: 'Updated Issue' });
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Issue not found' });
        });

        it('should return 500 if an error occurs while updating the issue', async () => {
            mockIssueService.updateIssue.mockRejectedValue(new Error('Failed to update issue'));
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { summary: 'Updated Issue' };

            await issueController.updateIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to update issue' });
        });
    });

    describe('deleteIssue', () => {
        it('should return 204 on successful deletion', async () => {
            mockIssueService.deleteIssue.mockResolvedValue(true);
            mockRequest.params = { issueKey: 'TEST-1' };

            await issueController.deleteIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.deleteIssue).toHaveBeenCalledWith('TEST-1');
            expect(mockStatus).toHaveBeenCalledWith(204);
            expect(mockSend).toHaveBeenCalled();
        });

        it('should return 404 if the issue is not found', async () => {
            mockIssueService.deleteIssue.mockResolvedValue(false);
            mockRequest.params = { issueKey: 'TEST-1' };

            await issueController.deleteIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.deleteIssue).toHaveBeenCalledWith('TEST-1');
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Issue not found' });
        });

        it('should return 500 if an error occurs during deletion', async () => {
            mockIssueService.deleteIssue.mockRejectedValue(new Error('Failed to delete issue'));
            mockRequest.params = { issueKey: 'TEST-1' };

            await issueController.deleteIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to delete issue' });
        });
    });

    describe('addAttachment', () => {
        const mockFile: Express.Multer.File = {
            fieldname: 'attachment',
            originalname: 'test.txt',
            encoding: '7bit',
            mimetype: 'text/plain',
            size: 1024,
            stream: null as any,
            destination: 'uploads/',
            filename: 'attachment-12345.txt',
            path: 'uploads/attachment-12345.txt',
            buffer: null as any,
        };

        it('should return 201 with attachment details on success', async () => {
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.file = mockFile;
            mockIssueService.addAttachment.mockResolvedValue({
                issueKey: 'TEST-1',
                filePath: mockFile.path,
                originalFilename: mockFile.originalname,
                fileSize: mockFile.size,
                mimeType: mockFile.mimetype,
            });

            await issueController.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.addAttachment).toHaveBeenCalledWith(
                'TEST-1',
                mockFile.path,
                mockFile.originalname,
                mockFile.size,
                mockFile.mimetype
            );
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Attachment added successfully',
                attachment: expect.objectContaining({
                    filename: mockFile.originalname,
                    filePath: mockFile.path,
                    fileSize: mockFile.size,
                    mimeType: mockFile.mimetype,
                    issueKey: 'TEST-1',
                }),
            }));
        });

        it('should return 400 if no file is uploaded', async () => {
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.file = undefined;

            await issueController.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'No file uploaded' });
        });

        it('should return 413 if file size exceeds the limit', async () => {
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.file = {
                ...mockFile,
                size: 10 * 1024 * 1024 + 1, // Exceeds 10MB
            };

            await issueController.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(413);
            expect(mockJson).toHaveBeenCalledWith({ error: 'File size exceeds the limit of 10MB' });
        });

        it('should return 400 if the issue key is missing', async () => {
            mockRequest.params = {};
            await issueController.addAttachment(mockRequest as Request, mockResponse as Response);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Issue key is required' });
        });

        it('should return 400 if an invalid file type is uploaded', async () => {
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.file = {
                ...mockFile,
                mimetype: 'application/exe',
            };

            await issueController.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid file type. Allowed types are: image/jpeg, image/png, image/gif, application/pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        });

        it('should return 500 if an error occurs while adding the attachment', async () => {
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.file = mockFile;
            mockIssueService.addAttachment.mockRejectedValue(new Error('Failed to add attachment'));

            await issueController.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to add attachment' });
        });
    });

    describe('linkIssue', () => {
        it('should return 200 on successful linking', async () => {
            mockIssueService.linkIssue.mockResolvedValue(true);
            mockRequest.params = { fromIssueKey: 'TEST-1' };
            mockRequest.body = { toIssueKey: 'TEST-2', type: 'RELATES_TO' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.linkIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.linkIssue).toHaveBeenCalledWith('TEST-1', 'TEST-2', 'RELATES_TO');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Issues linked' });
        });

        it('should return 400 if validation fails', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid link type' }] });
            mockRequest.params = { fromIssueKey: 'TEST-1' };
            mockRequest.body = { toIssueKey: 'TEST-2', type: 'INVALID' };

            await issueController.linkIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid link type' }] });
        });

        it('should return 400 if linking fails', async () => {
            mockIssueService.linkIssue.mockResolvedValue(false);
            mockRequest.params = { fromIssueKey: 'TEST-1' };
            mockRequest.body = { toIssueKey: 'TEST-2', type: 'RELATES_TO' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.linkIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.linkIssue).toHaveBeenCalledWith('TEST-1', 'TEST-2', 'RELATES_TO');
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to link issues' });
        });

        it('should return 500 if an error occurs during linking', async () => {
            mockIssueService.linkIssue.mockRejectedValue(new Error('Failed to link issue'));
            mockRequest.params = { fromIssueKey: 'TEST-1' };
            mockRequest.body = { toIssueKey: 'TEST-2', type: 'RELATES_TO' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.linkIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to link issue' });
        });
    });

    describe('assignIssue', () => {
        it('should return 200 with the updated issue on success', async () => {
            const mockIssue: Issue = { issueKey: 'TEST-1', summary: 'Test Issue', description: 'Test Description', issueType: 'Task', boardId: '1', assignee: 'user2' };
            mockIssueService.assignIssue.mockResolvedValue(mockIssue);
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { assigneeKey: 'user2' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.assignIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.assignIssue).toHaveBeenCalledWith('TEST-1', 'user2');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 400 if validation fails', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid assigneeKey' }] });
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { assigneeKey: 'user2' };

            await issueController.assignIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid assigneeKey' }] });
        });

        it('should return 404 if the issue is not found', async () => {
            mockIssueService.assignIssue.mockResolvedValue(undefined);
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { assigneeKey: 'user2' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.assignIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.assignIssue).toHaveBeenCalledWith('TEST-1', 'user2');
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Issue not found' });
        });

        it('should return 500 if an error occurs while assigning the issue', async () => {
            mockIssueService.assignIssue.mockRejectedValue(new Error('Failed to assign issue'));
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { assigneeKey: 'user2' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.assignIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to assign issue' });
        });
    });

    describe('transitionIssue', () => {
        it('should return 200 with the updated issue on success', async () => {
            const mockIssue: Issue = { issueKey: 'TEST-1', summary: 'Test Issue', description: 'Test Description', issueType: 'Task', boardId: '1', assignee: 'user1', status: 'DONE' };
            mockIssueService.transitionIssue.mockResolvedValue(mockIssue);
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { transitionId: 'DONE' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.transitionIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.transitionIssue).toHaveBeenCalledWith('TEST-1', 'DONE');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 400 if validation fails', async () => {
            mockValidationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid transitionId' }] });
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { transitionId: '' };

            await issueController.transitionIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid transitionId' }] });
        });

        it('should return 404 if the issue is not found', async () => {
            mockIssueService.transitionIssue.mockResolvedValue(undefined);
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { transitionId: 'DONE' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.transitionIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.transitionIssue).toHaveBeenCalledWith('TEST-1', 'DONE');
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Issue not found' });
        });

        it('should return 500 if an error occurs while transitioning the issue', async () => {
            mockIssueService.transitionIssue.mockRejectedValue(new Error('Failed to transition issue'));
            mockRequest.params = { issueKey: 'TEST-1' };
            mockRequest.body = { transitionId: 'DONE' };
            mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

            await issueController.transitionIssue(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to transition issue' });
        });
    });

    describe('getCreateMeta', () => {
        it('should return 200 with create metadata on success', async () => {
            const mockCreateMeta = { projects: [{ id: '1', name: 'Project 1', issuetypes: [{ id: '1', name: 'Task' }] }] };
            mockIssueService.getCreateMeta.mockResolvedValue(mockCreateMeta);

            await issueController.getCreateMeta(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.getCreateMeta).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockCreateMeta);
        });

        it('should return 500 if an error occurs while getting create meta', async () => {
            mockIssueService.getCreateMeta.mockRejectedValue(new Error('Failed to get create meta'));

            await issueController.getCreateMeta(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to get create meta' });
        });
    });

    describe('getTransitions', () => {
        it('should return 200 with transitions on success', async () => {
            const mockTransitions = [{ id: '1', name: 'To Do' }, { id: '2', name: 'In Progress' }];
            mockIssueService.getTransitions.mockResolvedValue(mockTransitions);
            mockRequest.params = { issueKey: 'TEST-1' };

            await issueController.getTransitions(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.getTransitions).toHaveBeenCalledWith('TEST-1');
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockTransitions);
        });

        it('should return 500 if an error occurs while getting transitions', async () => {
            const errorMessage = 'Failed to get transitions';
            mockIssueService.getTransitions.mockRejectedValue(new Error(errorMessage));
            mockRequest.params = { issueKey: 'TEST-1' };

            await issueController.getTransitions(mockRequest as Request, mockResponse as Response);

            expect(mockIssueService.getTransitions).toHaveBeenCalledWith('TEST-1');
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
        });
    });
});