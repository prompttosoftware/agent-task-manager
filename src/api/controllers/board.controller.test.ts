// src/api/controllers/board.controller.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import * as boardController from './board.controller';
import * as boardService from '../../services/board.service';
import { Board } from '../../types/board';
import { InputValidationError, BoardNotFoundError } from './board.controller'; // Import custom errors

// Mock the boardService
vi.mock('../../services/board.service');

// Helper function to create a mock request
const createMockRequest = (body: any = {}, params: any = {}, query: any = {}) => {
    return {
        body,
        params,
        query,
        get: (header: string) => { // Add get method for header testing
            if (header === 'Content-Type') {
                return 'application/json';
            }
            return undefined;
        },
    } as Request;
};

// Helper function to create a mock response
const createMockResponse = () => {
    const res: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
    };
    return res as Response;
};

// Helper function to create a mock next function
const createMockNext = () => {
    return vi.fn() as NextFunction;
};

describe('Board Controller', { timeout: 10000 }, () => { // Increased timeout to allow for debugging

    // Reset mocks before each test
    beforeEach(() => {
        vi.clearAllMocks();
    });


    describe('createBoard', () => {
        it('should create a board successfully', async () => {
            // Arrange
            const req = createMockRequest({ name: 'Test Board', description: 'Test Description' });
            const res = createMockResponse();
            const next = createMockNext();
            const mockBoard: Board = { id: '1', name: 'Test Board', description: 'Test Description' };
            vi.mocked(boardService.createBoard).mockResolvedValue(mockBoard);

            // Act
            await boardController.createBoard(req, res, next);

            // Assert
            expect(boardService.createBoard).toHaveBeenCalledWith({ name: 'Test Board', description: 'Test Description' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockBoard);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle input validation errors', async () => {
            // Arrange
            const req = createMockRequest({ name: '', description: 'Test Description' }); // Invalid name
            const res = createMockResponse();
            const next = createMockNext();

            // Act
            await boardController.createBoard(req, res, next);

            // Assert
            expect(boardService.createBoard).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'InputValidationError',
                errors: expect.any(Array),
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle internal server errors from the service', async () => {
            // Arrange
            const req = createMockRequest({ name: 'Test Board', description: 'Test Description' });
            const res = createMockResponse();
            const next = createMockNext();
            vi.mocked(boardService.createBoard).mockRejectedValue(new Error('Service error'));

            // Act
            await boardController.createBoard(req, res, next);

            // Assert
            expect(boardService.createBoard).toHaveBeenCalledWith({ name: 'Test Board', description: 'Test Description' });
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'InternalServerError', message: 'An unexpected error occurred' });
            expect(next).not.toHaveBeenCalled();
        });

    });

    describe('getBoardById', () => {
        it('should get a board by ID successfully', async () => {
            // Arrange
            const req = createMockRequest({}, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            const mockBoard: Board = { id: '1', name: 'Test Board', description: 'Test Description' };
            vi.mocked(boardService.getBoardById).mockResolvedValue(mockBoard);

            // Act
            await boardController.getBoardById(req, res, next);

            // Assert
            expect(boardService.getBoardById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockBoard);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle input validation errors (invalid ID format)', async () => {
            // Arrange
            const req = createMockRequest({}, { id: 'abc' });
            const res = createMockResponse();
            const next = createMockNext();

            // Act
            await boardController.getBoardById(req, res, next);

            // Assert
            expect(boardService.getBoardById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'InputValidationError',
                errors: expect.any(Array),
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle board not found errors', async () => {
            // Arrange
            const req = createMockRequest({}, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            vi.mocked(boardService.getBoardById).mockResolvedValue(null);

            // Act
            await boardController.getBoardById(req, res, next);

            // Assert
            expect(boardService.getBoardById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'BoardNotFoundError', message: 'Board not found' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle internal server errors from the service', async () => {
            // Arrange
            const req = createMockRequest({}, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            vi.mocked(boardService.getBoardById).mockRejectedValue(new Error('Service error'));

            // Act
            await boardController.getBoardById(req, res, next);

            // Assert
            expect(boardService.getBoardById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'InternalServerError', message: 'An unexpected error occurred' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('updateBoard', () => {
        it('should update a board successfully', async () => {
            // Arrange
            const req = createMockRequest({ name: 'Updated Name' }, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            const mockBoard: Board = { id: '1', name: 'Updated Name', description: 'Test Description' };
            vi.mocked(boardService.updateBoard).mockResolvedValue(mockBoard);

            // Act
            await boardController.updateBoard(req, res, next);

            // Assert
            expect(boardService.updateBoard).toHaveBeenCalledWith(1, { name: 'Updated Name', description: undefined });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockBoard);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle input validation errors (invalid ID format)', async () => {
            // Arrange
            const req = createMockRequest({ name: 'Updated Name' }, { id: 'abc' });
            const res = createMockResponse();
            const next = createMockNext();

            // Act
            await boardController.updateBoard(req, res, next);

            // Assert
            expect(boardService.updateBoard).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'InputValidationError',
                errors: expect.any(Array),
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle input validation errors (invalid update data)', async () => {
            // Arrange
            const req = createMockRequest({ name: '' }, { id: '1' }); // Invalid name
            const res = createMockResponse();
            const next = createMockNext();

            // Act
            await boardController.updateBoard(req, res, next);

            // Assert
            expect(boardService.updateBoard).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'InputValidationError',
                errors: expect.any(Array),
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle board not found errors', async () => {
            // Arrange
            const req = createMockRequest({ name: 'Updated Name' }, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            vi.mocked(boardService.updateBoard).mockResolvedValue(null);

            // Act
            await boardController.updateBoard(req, res, next);

            // Assert
            expect(boardService.updateBoard).toHaveBeenCalledWith(1, { name: 'Updated Name', description: undefined });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'BoardNotFoundError', message: 'Board not found for update' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle internal server errors from the service', async () => {
            // Arrange
            const req = createMockRequest({ name: 'Updated Name' }, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            vi.mocked(boardService.updateBoard).mockRejectedValue(new Error('Service error'));

            // Act
            await boardController.updateBoard(req, res, next);

            // Assert
            expect(boardService.updateBoard).toHaveBeenCalledWith(1, { name: 'Updated Name', description: undefined });
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'InternalServerError', message: 'An unexpected error occurred' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('deleteBoard', () => {
        it('should delete a board successfully', async () => {
            // Arrange
            const req = createMockRequest({}, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            vi.mocked(boardService.deleteBoard).mockResolvedValue(true);

            // Act
            await boardController.deleteBoard(req, res, next);

            // Assert
            expect(boardService.deleteBoard).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle input validation errors (invalid ID format)', async () => {
            // Arrange
            const req = createMockRequest({}, { id: 'abc' });
            const res = createMockResponse();
            const next = createMockNext();

            // Act
            await boardController.deleteBoard(req, res, next);

            // Assert
            expect(boardService.deleteBoard).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'InputValidationError',
                errors: expect.any(Array),
            }));
            expect(next).not.toHaveBeenCalled();
        });


        it('should handle board not found errors', async () => {
            // Arrange
            const req = createMockRequest({}, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            vi.mocked(boardService.deleteBoard).mockResolvedValue(false);

            // Act
            await boardController.deleteBoard(req, res, next);

            // Assert
            expect(boardService.deleteBoard).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'BoardNotFoundError', message: 'Board not found for deletion' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle internal server errors from the service', async () => {
            // Arrange
            const req = createMockRequest({}, { id: '1' });
            const res = createMockResponse();
            const next = createMockNext();
            vi.mocked(boardService.deleteBoard).mockRejectedValue(new Error('Service error'));

            // Act
            await boardController.deleteBoard(req, res, next);

            // Assert
            expect(boardService.deleteBoard).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'InternalServerError', message: 'An unexpected error occurred' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});