// src/api/controllers/board.controller.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';
import * as boardController from '../../src/api/controllers/board.controller';
import * as boardService from '../../src/services/board.service';
import { Board } from '../../src/types/board';
import { validationResult, Result, ValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Mock the board service
vi.mock('../../src/services/board.service', () => ({
    createBoard: vi.fn(),
    getBoardById: vi.fn(),
    updateBoard: vi.fn(),
    deleteBoard: vi.fn(),
}));

// Mock express-validator
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
    check: vi.fn(() => ({
        notEmpty: vi.fn(() => ({
            withMessage: vi.fn(() => ({
                isString: vi.fn(() => ({
                    withMessage: vi.fn(() => ({
                        trim: vi.fn(() => ({
                            escape: vi.fn(() => ({
                                isLength: vi.fn(() => ({
                                    withMessage: vi.fn(() => ({
                                        run: vi.fn(() => ({
                                            isEmpty: vi.fn(() => false),
                                            array: vi.fn(() => []),
                                        })),
                                    })),
                                })),
                            })),
                        })),
                    })),
                })),
            })),
        })),
        optional: vi.fn(() => ({
            isString: vi.fn(() => ({
                withMessage: vi.fn(() => ({
                    trim: vi.fn(() => ({
                        escape: vi.fn(() => ({
                            isLength: vi.fn(() => ({
                                withMessage: vi.fn(() => ({
                                    run: vi.fn(() => ({
                                        isEmpty: vi.fn(() => false),
                                        array: vi.fn(() => []),
                                    })),
                                })),
                            })),
                        })),
                    })),
                })),
            })),
        })),
        isInt: vi.fn(() => ({
            withMessage: vi.fn(() => ({
                toInt: vi.fn(() => ({
                    run: vi.fn(() => ({
                        isEmpty: vi.fn(() => false),
                        array: vi.fn(() => []),
                    })),
                })),
            })),
        })),
    })),
}));



describe('Board Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Helper function to create a mock request and response
    const createMockContext = () => {
        const req = {
            body: {},
            params: {},
        } as any;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        } as any;
        const next = vi.fn() as NextFunction;
        return { req, res, next };
    };


    describe('createBoard', () => {
        it('should create a board and return 201 with the new board', async () => {
            const { req, res, next } = createMockContext();
            const newBoard: Board = { id: '1', name: 'Test Board', description: 'Test Description' };
            (boardService.createBoard as any).mockResolvedValue(newBoard);
            req.body = { name: 'Test Board', description: 'Test Description' };

            await boardController.createBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(newBoard);
            expect(boardService.createBoard).toHaveBeenCalledWith({ name: 'Test Board', description: 'Test Description' });
        });

        it('should return 400 if validation fails', async () => {
            const { req, res, next } = createMockContext();
            const errors: ValidationError[] = [{ param: 'name', msg: 'Name is required', location: 'body', value: '' }];
            (validationResult as any).mockReturnValue({ isEmpty: () => false, array: () => errors });
            req.body = { name: '', description: '' };

            await boardController.createBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'InputValidationError',
                    errors: errors,
                })
            );
            expect(boardService.createBoard).not.toHaveBeenCalled();
        });

        it('should return 500 if an unexpected error occurs during board creation', async () => {
            const { req, res, next } = createMockContext();
            const error = new Error('Something went wrong');
            (boardService.createBoard as any).mockRejectedValue(error);
            req.body = { name: 'Test Board', description: 'Test Description' };

            await boardController.createBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'InternalServerError',
                    message: 'An unexpected error occurred',
                })
            );
        });

    });


    describe('getBoardById', () => {
        it('should get a board by id and return 200 with the board', async () => {
            const { req, res, next } = createMockContext();
            const board: Board = { id: '1', name: 'Test Board', description: 'Test Description' };
            (boardService.getBoardById as any).mockResolvedValue(board);
            req.params = { id: '1' };

            await boardController.getBoardById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(board);
            expect(boardService.getBoardById).toHaveBeenCalledWith(1);
        });

        it('should return 400 if ID validation fails', async () => {
            const { req, res, next } = createMockContext();
            const errors: ValidationError[] = [{ param: 'id', msg: 'Invalid ID', location: 'params', value: 'abc' }];
            (validationResult as any).mockReturnValue({ isEmpty: () => false, array: () => errors });
            req.params = { id: 'abc' };

            await boardController.getBoardById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'InputValidationError',
                    errors: errors,
                })
            );
            expect(boardService.getBoardById).not.toHaveBeenCalled();
        });

        it('should return 404 if board not found', async () => {
            const { req, res, next } = createMockContext();
            (boardService.getBoardById as any).mockResolvedValue(null);
            req.params = { id: '2' };

            await boardController.getBoardById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'BoardNotFoundError',
                    message: 'Board not found',
                })
            );
            expect(boardService.getBoardById).toHaveBeenCalledWith(2);
        });

        it('should return 500 if an unexpected error occurs during getBoardById', async () => {
            const { req, res, next } = createMockContext();
            const error = new Error('Something went wrong');
            (boardService.getBoardById as any).mockRejectedValue(error);
            req.params = { id: '1' };

            await boardController.getBoardById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'InternalServerError',
                    message: 'An unexpected error occurred',
                })
            );
        });
    });


    describe('updateBoard', () => {
        it('should update a board and return 200 with the updated board', async () => {
            const { req, res, next } = createMockContext();
            const updatedBoard: Board = { id: '1', name: 'Updated Board', description: 'Updated Description' };
            (boardService.updateBoard as any).mockResolvedValue(updatedBoard);
            req.params = { id: '1' };
            req.body = { name: 'Updated Board', description: 'Updated Description' };

            await boardController.updateBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedBoard);
            expect(boardService.updateBoard).toHaveBeenCalledWith(1, { name: 'Updated Board', description: 'Updated Description' });
        });

        it('should return 400 if ID or update data validation fails', async () => {
            const { req, res, next } = createMockContext();
            const errors: ValidationError[] = [{ param: 'name', msg: 'Name is required', location: 'body', value: '' }];
            (validationResult as any).mockReturnValue({ isEmpty: () => false, array: () => errors });
            req.params = { id: '1' };
            req.body = { name: '', description: '' };

            await boardController.updateBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'InputValidationError',
                    errors: errors,
                })
            );
            expect(boardService.updateBoard).not.toHaveBeenCalled();
        });

        it('should return 404 if board not found', async () => {
            const { req, res, next } = createMockContext();
            (boardService.updateBoard as any).mockResolvedValue(null);
            req.params = { id: '2' };
            req.body = { name: 'Updated Board', description: 'Updated Description' };

            await boardController.updateBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'BoardNotFoundError',
                    message: 'Board not found for update',
                })
            );
            expect(boardService.updateBoard).toHaveBeenCalledWith(2, { name: 'Updated Board', description: 'Updated Description' });
        });

        it('should return 500 if an unexpected error occurs during updateBoard', async () => {
            const { req, res, next } = createMockContext();
            const error = new Error('Something went wrong');
            (boardService.updateBoard as any).mockRejectedValue(error);
            req.params = { id: '1' };
            req.body = { name: 'Updated Board', description: 'Updated Description' };

            await boardController.updateBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'InternalServerError',
                    message: 'An unexpected error occurred',
                })
            );
        });
    });

    describe('deleteBoard', () => {
        it('should delete a board and return 204 (No Content)', async () => {
            const { req, res, next } = createMockContext();
            (boardService.deleteBoard as any).mockResolvedValue(true);
            req.params = { id: '1' };

            await boardController.deleteBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
            expect(boardService.deleteBoard).toHaveBeenCalledWith(1);
        });

        it('should return 400 if ID validation fails', async () => {
            const { req, res, next } = createMockContext();
            const errors: ValidationError[] = [{ param: 'id', msg: 'Invalid ID', location: 'params', value: 'abc' }];
            (validationResult as any).mockReturnValue({ isEmpty: () => false, array: () => errors });
            req.params = { id: 'abc' };

            await boardController.deleteBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'InputValidationError',
                    errors: errors,
                })
            );
            expect(boardService.deleteBoard).not.toHaveBeenCalled();
        });


        it('should return 404 if board not found', async () => {
            const { req, res, next } = createMockContext();
            (boardService.deleteBoard as any).mockResolvedValue(false);
            req.params = { id: '2' };

            await boardController.deleteBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'BoardNotFoundError',
                    message: 'Board not found for deletion',
                })
            );
            expect(boardService.deleteBoard).toHaveBeenCalledWith(2);
        });

        it('should return 500 if an unexpected error occurs during deleteBoard', async () => {
            const { req, res, next } = createMockContext();
            const error = new Error('Something went wrong');
            (boardService.deleteBoard as any).mockRejectedValue(error);
            req.params = { id: '1' };

            await boardController.deleteBoard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'InternalServerError',
                    message: 'An unexpected error occurred',
                })
            );
        });
    });
});