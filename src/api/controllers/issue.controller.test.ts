// src/api/controllers/issue.controller.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as issueController from './issue.controller';
import * as issueService from '../services/issue.service';
import { Issue } from '../types/issue.d';
import { validationResult } from 'express-validator';
import { HttpException } from '../../api/middleware/error.middleware';

vi.mock('../services/issue.service');
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
}));

const mockIssue: Issue = {
    id: '1',
    summary: 'Test Summary',
    description: 'Test Description',
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const mockIssue2: Issue = {
    id: '2',
    summary: 'Test Summary 2',
    description: 'Test Description 2',
    status: 'in progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('Issue Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn()
        };
        (issueService.createIssue as any).mockClear();
        (issueService.updateIssue as any).mockClear();
        (issueService.getIssueById as any).mockClear();
        (issueService.listIssues as any).mockClear();
        (issueService.deleteIssue as any).mockClear();
        (validationResult as any).mockClear();
    });

    describe('addIssue', () => {
        it('should return 400 if validation fails', async () => {
            (validationResult as any).mockImplementation(() => ({
                isEmpty: () => false,
                array: () => [{ msg: 'Validation error' }],
            }));

            await issueController.addIssue(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Validation error' }] });
        });

        it('should create an issue and return 201 with the new issue', async () => {
            (validationResult as any).mockImplementation(() => ({
                isEmpty: () => true,
            }));
            (issueService.createIssue as any).mockResolvedValue(mockIssue);
            req.body = { summary: 'Test', description: 'Test', status: 'open' };

            await issueController.addIssue(req as Request, res as Response);

            expect(validationResult).toHaveBeenCalled();
            expect(issueService.createIssue).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 500 if issue creation fails', async () => {
            (validationResult as any).mockImplementation(() => ({
                isEmpty: () => true,
            }));
            const errorMessage = 'Failed to create issue';
            (issueService.createIssue as any).mockRejectedValue(new Error(errorMessage));
            req.body = { summary: 'Test', description: 'Test', status: 'open' };

            await issueController.addIssue(req as Request, res as Response);

            expect(issueService.createIssue).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });

    describe('updateIssue', () => {
        it('should return 400 if validation fails', async () => {
            (validationResult as any).mockImplementation(() => ({
                isEmpty: () => false,
                array: () => [{ msg: 'Validation error' }],
            }));
            req.params = { id: '1' };

            await issueController.updateIssue(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Validation error' }] });
        });

        it('should return 400 if issue ID is invalid', async () => {
            req.params = { id: 'abc' };
            (validationResult as any).mockImplementation(() => ({
                isEmpty: () => true,
            }));

            await issueController.updateIssue(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
        });

        it('should update an issue and return 200 with the updated issue', async () => {
            (validationResult as any).mockImplementation(() => ({
                isEmpty: () => true,
            }));
            const updatedIssue = { ...mockIssue, summary: 'Updated Summary' };
            (issueService.updateIssue as any).mockResolvedValue(updatedIssue);
            req.params = { id: '1' };
            req.body = { summary: 'Updated Summary' };

            await issueController.updateIssue(req as Request, res as Response);

            expect(validationResult).toHaveBeenCalled();
            expect(issueService.updateIssue).toHaveBeenCalledWith(1, req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedIssue);
        });

        it('should return 500 if issue update fails', async () => {
            (validationResult as any).mockImplementation(() => ({
                isEmpty: () => true,
            }));
            const errorMessage = 'Failed to update issue';
            (issueService.updateIssue as any).mockRejectedValue(new Error(errorMessage));
            req.params = { id: '1' };
            req.body = { summary: 'Updated Summary' };

            await issueController.updateIssue(req as Request, res as Response);

            expect(issueService.updateIssue).toHaveBeenCalledWith(1, req.body);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });

    describe('getIssue', () => {
        it('should return 200 and the issue if found', async () => {
            (issueService.getIssueById as any).mockResolvedValue(mockIssue);
            req.params = { id: '1' };

            await issueController.getIssue(req as Request, res as Response);

            expect(issueService.getIssueById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 400 if issue ID is invalid', async () => {
            req.params = { id: 'abc' };

            await issueController.getIssue(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
        });

        it('should return 404 if the issue is not found', async () => {
            (issueService.getIssueById as any).mockResolvedValue(undefined);
            req.params = { id: '1' };

            await issueController.getIssue(req as Request, res as Response);

            expect(issueService.getIssueById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Issue not found' });
        });

        it('should return 500 if there is an error', async () => {
            const errorMessage = 'Failed to get issue';
            (issueService.getIssueById as any).mockRejectedValue(new Error(errorMessage));
            req.params = { id: '1' };

            await issueController.getIssue(req as Request, res as Response);

            expect(issueService.getIssueById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });

    describe('deleteIssue', () => {
        it('should return 400 if issue ID is invalid', async () => {
            req.params = { id: 'abc' };

            await issueController.deleteIssue(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
        });
        it('should return 204 on successful delete', async () => {
            (issueService.deleteIssue as any).mockResolvedValue(undefined);
            req.params = { id: '1' };

            await issueController.deleteIssue(req as Request, res as Response);

            expect(issueService.deleteIssue).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it('should return 500 if delete fails', async () => {
            const errorMessage = 'Failed to delete issue';
            (issueService.deleteIssue as any).mockRejectedValue(new Error(errorMessage));
            req.params = { id: '1' };

            await issueController.deleteIssue(req as Request, res as Response);

            expect(issueService.deleteIssue).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });


    describe('listIssues', () => {
        it('should return 200 and a list of issues', async () => {
            const issueList = [mockIssue, mockIssue2];
            (issueService.listIssues as any).mockResolvedValue(issueList);

            await issueController.listIssues(req as Request, res as Response);

            expect(issueService.listIssues).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(issueList);
        });

        it('should handle query parameters for filtering', async () => {
            const issueList = [mockIssue];
            (issueService.listIssues as any).mockResolvedValue(issueList);
            req.query = { status: 'open' };

            await issueController.listIssues(req as Request, res as Response);

            expect(issueService.listIssues).toHaveBeenCalledWith({
                status: 'open',
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(issueList);
        });

        it('should return 500 if listing issues fails', async () => {
            const errorMessage = 'Failed to list issues';
            (issueService.listIssues as any).mockRejectedValue(new Error(errorMessage));

            await issueController.listIssues(req as Request, res as Response);

            expect(issueService.listIssues).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });
});