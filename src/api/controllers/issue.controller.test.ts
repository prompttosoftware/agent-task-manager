// src/api/controllers/issue.controller.test.ts
import { addAttachment, getIssue } from './issue.controller';
import * as issueService from '../services/issue.service';
import { Request, Response } from 'express';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { validationResult } from 'express-validator';
import * as multer from 'multer';

// Mock the issue service
vi.mock('../services/issue.service');
vi.mock('express-validator', () => ({validationResult: vi.fn()}));
vi.mock('multer', () => ({
    default: () => ({
        single: (fieldName: string) => (req: Request, res: Response, next: Function) => {
            req.file = { path: '/tmp/file.txt' }; // Mock file
            next();
        }
    })
}));

describe('Issue Controller - addAttachment', () => {
    let mockRequest: any;
    let mockResponse: any;
    const mockValidationResult = (errors: any) => {
        (validationResult as Mock).mockReturnValue({isEmpty: () => errors.length === 0,array: () => errors});
    };


    beforeEach(() => {
        mockRequest = {
            params: {
                issueKey: 'ISSUE-123',
            },
            file: { // Changed from files to file
                    path: '/tmp/file.txt'
            }
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        mockValidationResult([]); // Default: no validation errors
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should add an attachment and return 200 status', async () => {
        (issueService.addAttachment as Mock).mockResolvedValue(123); // Mock attachmentId

        await addAttachment(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(issueService.addAttachment).toHaveBeenCalledWith('ISSUE-123', '/tmp/file.txt');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Attachment uploaded successfully', attachmentId: 123 });
    });

    it('should return 400 status if no file is uploaded', async () => {
        mockRequest.file = undefined; // Changed from files to file

        await addAttachment(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No file uploaded' });
        expect(issueService.addAttachment).not.toHaveBeenCalled();
    });

    it('should return 400 status if validation fails', async () => {
        mockValidationResult([{ msg: 'Invalid issue key' }]); // Simulate a validation failure

        await addAttachment(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid issue key' }] });
        expect(issueService.addAttachment).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during adding attachment', async () => {
        const errorMessage = 'Failed to add attachment';
        (issueService.addAttachment as Mock).mockRejectedValue(new Error(errorMessage));

        await addAttachment(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(issueService.addAttachment).toHaveBeenCalledWith('ISSUE-123', '/tmp/file.txt');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('Issue Controller - getIssue', () => {
    let mockRequest: any;
    let mockResponse: any;
    const mockValidationResult = (errors: any) => {
        (validationResult as Mock).mockReturnValue({isEmpty: () => errors.length === 0,array: () => errors});
    };

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
        mockValidationResult([]); // Default: no validation errors
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should get an issue and return 200 status', async () => {
        const mockIssue = { id: 'ISSUE-123', title: 'Test Issue' };
        (issueService.getIssue as Mock).mockResolvedValue(mockIssue);

        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(issueService.getIssue).toHaveBeenCalledWith('ISSUE-123');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
    });

    it('should return 404 status if issue is not found', async () => {
        (issueService.getIssue as Mock).mockResolvedValue(undefined);

        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(issueService.getIssue).toHaveBeenCalledWith('ISSUE-123');
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
    });

    it('should return 400 status if validation fails', async () => {
        mockValidationResult([{ msg: 'Invalid issue key' }]); // Simulate a validation failure

        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid issue key' }] });
        expect(issueService.getIssue).not.toHaveBeenCalled();
    });

    it('should return 500 status if an error occurs during getting issue', async () => {
        const errorMessage = 'Failed to get issue';
        (issueService.getIssue as Mock).mockRejectedValue(new Error(errorMessage));

        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(issueService.getIssue).toHaveBeenCalledWith('ISSUE-123');
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});