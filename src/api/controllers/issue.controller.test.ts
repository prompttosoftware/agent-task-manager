import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import * as issueController from './issue.controller';
import * as issueService from '../services/issue.service';
import { Issue } from '../types/issue.d';
import { validationResult } from 'express-validator';
import { isUUID } from 'validator';

// Mock the entire module, providing mock implementations
vi.mock('../services/issue.service');
vi.mock('express-validator');
vi.mock('validator', () => ({
    isUUID: vi.fn()
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
        vi.clearAllMocks();

        // Set default mock implementations
        vi.mocked(issueService.createIssue).mockResolvedValue(mockIssue);
        vi.mocked(issueService.updateIssue).mockResolvedValue(mockIssue);
        vi.mocked(issueService.getIssueById).mockResolvedValue(mockIssue);
        vi.mocked(issueService.listIssues).mockResolvedValue([mockIssue]);
        vi.mocked(issueService.deleteIssue).mockResolvedValue(undefined);

        // Mock validationResult with a return value that includes the necessary methods
        vi.mocked(validationResult).mockReturnValue({
            isEmpty: vi.fn().mockReturnValue(true),
            array: vi.fn().mockReturnValue([]),
            formatWith: vi.fn().mockReturnThis(), // Ensure formatWith is defined
        });
    });

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('addIssue', () => {
        it('should return 400 if validation fails', async () => {
            vi.mocked(validationResult).mockReturnValue({ isEmpty: vi.fn().mockReturnValue(false), array: vi.fn().mockReturnValue([{ msg: 'Validation error' }]) });
            await issueController.addIssue(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Validation error' }] });
        });

        it('should create an issue and return 201 with the new issue', async () => {
            req.body = { summary: 'Test', description: 'Test', status: 'open', id: 'some-uuid' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.addIssue(req as Request, res as Response);
            expect(validationResult).toHaveBeenCalled();
            expect(issueService.createIssue).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 400 if issue ID is invalid', async () => {
            vi.mocked(isUUID).mockReturnValue(false);
            req.body = { summary: 'Test', description: 'Test', status: 'open', id: 'not-a-uuid' };
            await issueController.addIssue(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
        });

        it('should return 500 if issue creation fails', async () => {
            const errorMessage = 'Failed to create issue';
            vi.mocked(issueService.createIssue).mockRejectedValue(new Error(errorMessage));
            req.body = { summary: 'Test', description: 'Test', status: 'open', id: 'some-uuid' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.addIssue(req as Request, res as Response);
            expect(issueService.createIssue).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });

    describe('updateIssue', () => {
        it('should return 400 if validation fails', async () => {
            vi.mocked(validationResult).mockReturnValue({ isEmpty: vi.fn().mockReturnValue(false), array: vi.fn().mockReturnValue([{ msg: 'Validation error' }]) });
            req.params = { id: '1' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.updateIssue(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Validation error' }] });
        });

        it('should return 400 if issue ID is invalid', async () => {
            vi.mocked(isUUID).mockReturnValue(false);
            req.params = { id: 'abc' };
            await issueController.updateIssue(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
        });

        it('should update an issue and return 200 with the updated issue', async () => {
            const updatedIssue = { ...mockIssue, summary: 'Updated Summary' };
            vi.mocked(issueService.updateIssue).mockResolvedValue(updatedIssue);
            req.params = { id: '1' };
            req.body = { summary: 'Updated Summary' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.updateIssue(req as Request, res as Response);
            expect(validationResult).toHaveBeenCalled();
            expect(issueService.updateIssue).toHaveBeenCalledWith(1, req.body); // Correct assertion
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedIssue);
        });

        it('should return 500 if issue update fails', async () => {
            const errorMessage = 'Failed to update issue';
            vi.mocked(issueService.updateIssue).mockRejectedValue(new Error(errorMessage));
            req.params = { id: '1' };
            req.body = { summary: 'Updated Summary' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.updateIssue(req as Request, res as Response);
            expect(issueService.updateIssue).toHaveBeenCalledWith(1, req.body); // Changed to '1'
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });

    describe('getIssue', () => {
        it('should return 400 if issue ID is invalid', async () => {
            vi.mocked(isUUID).mockReturnValue(false);
            req.params = { id: 'abc' };
            await issueController.getIssue(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
        });

        it('should return 200 and the issue if found', async () => {
            req.params = { id: '1' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.getIssue(req as Request, res as Response);
            expect(issueService.getIssueById).toHaveBeenCalledWith(1); // Changed to '1'
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockIssue);
        });

        it('should return 404 if the issue is not found', async () => {
            vi.mocked(issueService.getIssueById).mockResolvedValue(undefined);
            req.params = { id: '1' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.getIssue(req as Request, res as Response);
            expect(issueService.getIssueById).toHaveBeenCalledWith(1); // Changed to '1'
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Issue not found' });
        });

        it('should return 500 if there is an error', async () => {
            const errorMessage = 'Failed to get issue';
            vi.mocked(issueService.getIssueById).mockRejectedValue(new Error(errorMessage));
            req.params = { id: '1' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.getIssue(req as Request, res as Response);
            expect(issueService.getIssueById).toHaveBeenCalledWith(1); // Changed to '1'
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });

    describe('deleteIssue', () => {
        it('should return 400 if issue ID is invalid', async () => {
            vi.mocked(isUUID).mockReturnValue(false);
            req.params = { id: 'abc' };
            await issueController.deleteIssue(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
        });
        it('should return 204 on successful delete', async () => {
            req.params = { id: '1' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.deleteIssue(req as Request, res as Response);
            expect(issueService.deleteIssue).toHaveBeenCalledWith(1); // Changed to '1'
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it('should return 500 if delete fails', async () => {
            const errorMessage = 'Failed to delete issue';
            vi.mocked(issueService.deleteIssue).mockRejectedValue(new Error(errorMessage));
            req.params = { id: '1' };
            vi.mocked(isUUID).mockReturnValue(true);
            await issueController.deleteIssue(req as Request, res as Response);
            expect(issueService.deleteIssue).toHaveBeenCalledWith(1); // Changed to '1'
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });


    describe('listIssues', () => {
        it('should return 200 and a list of issues', async () => {
            await issueController.listIssues(req as Request, res as Response);
            expect(issueService.listIssues).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([mockIssue]);
        });

        it('should handle query parameters for filtering', async () => {
            const issueList = [mockIssue];
            vi.mocked(issueService.listIssues).mockResolvedValue(issueList);
            req.query = { status: 'open' };
            await issueController.listIssues(req as Request, res as Response);
            expect(issueService.listIssues).toHaveBeenCalledWith(req.query); // Correct assertion with req.query
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(issueList);
        });

        it('should return 500 if listing issues fails', async () => {
            const errorMessage = 'Failed to list issues';
            vi.mocked(issueService.listIssues).mockRejectedValue(new Error(errorMessage));
            await issueController.listIssues(req as Request, res as Response);
            expect(issueService.listIssues).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
        });
    });
});