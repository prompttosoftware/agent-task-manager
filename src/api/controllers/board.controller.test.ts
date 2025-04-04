// src/api/controllers/board.controller.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index'; // Assuming your app is exported from index.ts
import * as boardService from '../services/board.service';
import { validationResult } from 'express-validator';
import { Request, Response } from 'express';
import * as boardController from './board.controller';

// Mock the express-validator and boardService modules
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
}));

// Helper function to create a mock request and response
const createMockRequestResponse = () => {
    const req = {
        params: {},
    } as Request;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
    } as unknown as Response;
    return { req, res };
};


describe('Board Controller - DELETE /api/boards/:boardId', () => {

    afterEach(() => {
        vi.clearAllMocks(); // Reset mocks after each test
    });


    it('should delete a board successfully (204 status)', async () => {
        // Arrange
        const { req, res } = createMockRequestResponse();
        req.params.boardId = '1';
        vi.mocked(validationResult).mockReturnValue({ isEmpty: () => true }); // No validation errors
        vi.spyOn(boardService, 'deleteBoard').mockResolvedValueOnce(true);

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
        vi.spyOn(boardService, 'deleteBoard').mockRejectedValueOnce(new Error('Board not found'));

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
        vi.spyOn(boardService, 'deleteBoard').mockRejectedValueOnce(new Error('Internal server error'));

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
        vi.spyOn(boardService, 'deleteBoard').mockRejectedValueOnce(new Error(errorMessage));

        // Act
        await boardController.deleteBoard(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: `Failed to delete board: ${errorMessage}` });
        expect(boardService.deleteBoard).toHaveBeenCalledWith(3);
    });
});