import { Request, Response } from 'express';
import { IssueController } from './issue.controller';
import { IssueService } from '../services/issue.service';
import { BoardService } from '../services/board.service';
import { Issue } from '../types/issue';
import multer, { MulterError } from 'multer';
import { describe, it, expect, beforeEach, vi, Mock, afterEach } from 'vitest';
import { validationResult } from 'express-validator';
import { Readable } from 'stream';

// Mock the IssueService
vi.mock('../services/issue.service');
const mockIssueService = {
    addAttachment: vi.fn(),
} as jest.Mocked<IssueService>;

// Mock the BoardService
const mockBoardService = {} as jest.Mocked<BoardService>;

// Mock validationResult
vi.mock('express-validator', () => {
    const actual = vi.importActual('express-validator');
    return {
        ...actual,
        validationResult: vi.fn().mockReturnValue({ isEmpty: () => true, array: () => [] }),
    };
});

// Mock multer
vi.mock('multer', () => {
    const mockMulter = {
        single: vi.fn().mockImplementation((fieldName: string) => {
            return (req: Request, res: Response, next: Function) => {
                const upload = multer({
                    limits: {
                        fileSize: 10 * 1024 * 1024, // 10MB
                    },
                    fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
                        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                        if (!allowedMimeTypes.includes(file.mimetype)) {
                            const error = new MulterError('LIMIT_UNEXPECTED_FILE', 'attachment');
                            (error as any).message = 'Invalid file type. Allowed types are: image/jpeg, image/png, image/gif, application/pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                            return cb(error, false);
                        }
                        cb(null, true);
                    },
                }).single(fieldName);

                upload(req, res, (err: any) => {
                    if (err instanceof multer.MulterError) {
                        return next(err);
                    }
                    next();
                });
            };
        }),
        MulterError: multer.MulterError,
    };
    return mockMulter;
});

describe('IssueController', () => {
    let issueController: IssueController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockJson: Mock;
    let mockStatus: Mock;
    let mockNext: Mock;

    beforeEach(() => {
        issueController = new IssueController(mockIssueService as any, mockBoardService);
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        mockNext = vi.fn();

        mockRequest = {
            params: { issueKey: 'TEST-1' },
        };
        mockResponse = {
            status: mockStatus,
            json: mockJson,
        } as unknown as Response;
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('addAttachment', () => {
        const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
            fieldname: 'attachment',
            originalname: 'test.txt',
            encoding: '7bit',
            mimetype: 'text/plain',
            size: 1024,
            stream: Readable.from(''),
            destination: 'uploads/',
            filename: 'attachment-12345.txt',
            path: 'uploads/attachment-12345.txt',
            buffer: Buffer.from(''),
            ...overrides,
        });

        it('should return 201 with attachment details on success', async () => {
            const file = mockFile();
            (mockRequest as any).file = file;
            mockIssueService.addAttachment.mockResolvedValue({
                issueKey: 'TEST-1',
                filePath: file.path,
                originalFilename: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
            });

            await issueController.addAttachment(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockIssueService.addAttachment).toHaveBeenCalledWith(
                'TEST-1',
                file.path,
                file.originalname,
                file.size,
                file.mimetype
            );
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Attachment added successfully',
                    attachment: expect.objectContaining({
                        filename: file.originalname,
                        filePath: file.path,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                        issueKey: 'TEST-1',
                    }),
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 413 if file size exceeds the limit', async () => {
            const largeFile = mockFile({ size: 11 * 1024 * 1024 }); // More than 10MB
            (mockRequest as any).file = largeFile;
            mockIssueService.addAttachment.mockRejectedValue(new MulterError('LIMIT_FILE_SIZE', 'attachment'));

            await issueController.addAttachment(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockStatus).not.toHaveBeenCalled();
            expect(mockJson).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.any(MulterError));
            const error = mockNext.mock.calls[0][0] as MulterError;
            expect(error.code).toBe('LIMIT_FILE_SIZE');
        });

        it('should return 400 if an invalid file type is uploaded', async () => {
            const invalidFile = mockFile({ mimetype: 'application/exe' });
            (mockRequest as any).file = invalidFile;
            mockIssueService.addAttachment.mockRejectedValue(new MulterError('LIMIT_UNEXPECTED_FILE', 'attachment'));

            await issueController.addAttachment(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockStatus).not.toHaveBeenCalled();
            expect(mockJson).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.any(MulterError));
            const error = mockNext.mock.calls[0][0] as MulterError;
            expect(error.code).toBe('LIMIT_UNEXPECTED_FILE');
        });

        it('should return 400 if the issue key is missing', async () => {
            mockRequest.params = {};
            await issueController.addAttachment(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Issue key is required' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if an error occurs while adding the attachment', async () => {
            const file = mockFile();
            (mockRequest as any).file = file;
            mockIssueService.addAttachment.mockRejectedValue(new Error('Failed to add attachment'));
            await issueController.addAttachment(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to add attachment' });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});