// src/api/controllers/board.controller.test.ts
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index'; // Assuming your app is exported from index.ts
import * as boardService from '../services/board.service';
import { validationResult } from 'express-validator';
import { Request, Response } from 'express';
import * as boardController from './board.controller';
import { Board } from '../types/board';

// Mock the express-validator and boardService modules
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
}));

vi.mock('../services/board.service');

// Helper function to create a mock request and response
const createMockRequestResponse = () => {
    const req = {
        params: {},
        body: {},
    } as Request;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
    } as unknown as Response;
    return { req, res };
};

describe('Board Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/boards/:boardId', () => {
        it('should get a board successfully (200 status)', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '1';
            const mockBoard: Board = { id: 1, name: 'Test Board', description: 'Test Description' };
            vi.mocked(boardService.getBoard).mockResolvedValue(mockBoard);
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true });

            // Act
            await boardController.getBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockBoard);
            expect(boardService.getBoard).toHaveBeenCalledWith(1);
        });

        it('should return 404 if board is not found', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '2';
            vi.mocked(boardService.getBoard).mockResolvedValue(null);
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true });

            // Act
            await boardController.getBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Board not found' });
            expect(boardService.getBoard).toHaveBeenCalledWith(2);
        });

        it('should return 400 for validation error', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = 'abc'; // Invalid boardId
            const mockErrors = [{ msg: 'Invalid ID' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => mockErrors });

            // Act
            await boardController.getBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
            expect(boardService.getBoard).not.toHaveBeenCalled(); // Make sure getBoard wasn't called
        });

        it('should return 500 for internal server error', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '3';
            vi.mocked(boardService.getBoard).mockRejectedValueOnce(new Error('Internal server error'));
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true });

            // Act
            await boardController.getBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Failed to get board: Internal server error' });
            expect(boardService.getBoard).toHaveBeenCalledWith(3);
        });
    });

    describe('DELETE /api/boards/:boardId', () => {

        it('should delete a board successfully (204 status)', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '1';
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true }); // No validation errors
            vi.mocked(boardService.deleteBoard).mockResolvedValueOnce(undefined);

            // Act
            await boardController.deleteBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
            expect(boardService.deleteBoard).toHaveBeenCalledWith(1);
        });

        it('should return 404 if board is not found', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '2';
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true }); // No validation errors
            vi.mocked(boardService.deleteBoard).mockRejectedValueOnce(new Error('Board not found'));

            // Act
            await boardController.deleteBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Board not found' });
            expect(boardService.deleteBoard).toHaveBeenCalledWith(2);
        });

        it('should return 400 for validation error', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = 'abc'; // Invalid boardId
            const mockErrors = [{ msg: 'Invalid ID' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => mockErrors });

            // Act
            await boardController.deleteBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
            expect(boardService.deleteBoard).not.toHaveBeenCalled(); // Make sure deleteBoard wasn't called
        });

        it('should return 500 for internal server error', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '3';
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true }); // No validation errors
            vi.mocked(boardService.deleteBoard).mockRejectedValueOnce(new Error('Internal server error'));

            // Act
            await boardController.deleteBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Failed to delete board: Internal server error' });
            expect(boardService.deleteBoard).toHaveBeenCalledWith(3);
        });

        it('should return 500 for internal server error with error message', async () => {
            // Arrange
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '3';
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true }); // No validation errors
            const errorMessage = 'Custom error message';
            vi.mocked(boardService.deleteBoard).mockRejectedValueOnce(new Error(errorMessage));

            // Act
            await boardController.deleteBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: `Failed to delete board: ${errorMessage}` });
            expect(boardService.deleteBoard).toHaveBeenCalledWith(3);
        });
    });

    describe('POST /api/boards', () => {
        it('should create a board successfully (201 status)', async () => {
            const { req, res } = createMockRequestResponse();
            const newBoard: Board = { id: 1, name: 'New Board', description: 'New Description' };
            req.body = newBoard;
            vi.mocked(boardService.createBoard).mockResolvedValue(newBoard);
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true });

            await boardController.createBoard(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(newBoard);
            expect(boardService.createBoard).toHaveBeenCalledWith(newBoard);
        });

        it('should return 500 for internal server error', async () => {
            const { req, res } = createMockRequestResponse();
            const newBoard: Board = { id: 1, name: 'New Board', description: 'New Description' };
            req.body = newBoard;
            vi.mocked(boardService.createBoard).mockRejectedValueOnce(new Error('Internal server error'));
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true });

            await boardController.createBoard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create board: Internal server error' });
        });

          it('should return 400 for validation error', async () => {
            const { req, res } = createMockRequestResponse();
            const mockErrors = [{ msg: 'Name is required' }];
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => false, array: () => mockErrors });

            await boardController.createBoard(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
            expect(boardService.createBoard).not.toHaveBeenCalled();
        });
    });

    describe('PUT /api/boards/:boardId', () => {
        it('should update a board successfully (200 status)', async () => {
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '1';
            const updatedBoard: Partial<Board> = { name: 'Updated Board' };
            const existingBoard: Board = { id: 1, name: 'Original Board', description: 'Original Description' };
            vi.mocked(boardService.updateBoard).mockResolvedValue({ ...existingBoard, ...updatedBoard });
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true });

            await boardController.updateBoard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ ...existingBoard, ...updatedBoard });
            expect(boardService.updateBoard).toHaveBeenCalledWith(1, updatedBoard);
        });

        it('should return 404 if board is not found', async () => {
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '1';
            const updatedBoard: Partial<Board> = { name: 'Updated Board' };
            vi.mocked(boardService.updateBoard).mockResolvedValue(null);
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true });

            await boardController.updateBoard(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Board not found' });
            expect(boardService.updateBoard).toHaveBeenCalledWith(1, updatedBoard);
        });

        it('should return 500 for internal server error', async () => {
            const { req, res } = createMockRequestResponse();
            req.params.boardId = '1';
            const updatedBoard: Partial<Board> = { name: 'Updated Board' };
            vi.mocked(boardService.updateBoard).mockRejectedValueOnce(new Error('Internal server error'));
            vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true });

            await boardController.updateBoard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Failed to update board: Internal server error' });
        });
    });
});
