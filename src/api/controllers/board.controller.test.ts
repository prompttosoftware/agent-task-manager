// src/api/controllers/board.controller.test.ts

import { BoardController } from './board.controller';
import { BoardService } from '../services/board.service';
import { Request, Response } from 'express';
import { Board } from '../types/board.d.ts';
import { v4 as uuidv4 } from 'uuid';
import { check, validationResult } from 'express-validator';

// Mock the express-validator functions
jest.mock('express-validator', () => ({
    check: jest.fn().mockReturnValue({
        isUUID: jest.fn().mockReturnValue({
            withMessage: jest.fn().mockReturnValue({ run: jest.fn().mockResolvedValue(undefined) })
        }),
        notEmpty: jest.fn().mockReturnValue({
            withMessage: jest.fn().mockReturnValue({ run: jest.fn().mockResolvedValue(undefined) })
        }),
        optional: jest.fn().mockReturnValue({
            isString: jest.fn().mockReturnValue({
                withMessage: jest.fn().mockReturnValue({ run: jest.fn().mockResolvedValue(undefined) })
            })
        })
    }),
    validationResult: jest.fn()
}));

describe('BoardController', () => {
    let boardService: BoardService;
    let boardController: BoardController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockJson: jest.Mock;
    let mockSend: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        boardService = new BoardService();
        boardController = new BoardController(boardService);

        mockJson = jest.fn();
        mockSend = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockSend });

        mockRequest = {};
        mockResponse = {
            status: mockStatus,
            json: mockJson,
            send: mockSend,
        };

        // Reset mock implementations
        (validationResult as jest.Mock).mockClear();
        (check as jest.Mock).mockClear();
    });

    describe('getBoard', () => {
        it('should successfully retrieve a board', async () => {
            const boardId = uuidv4();
            const mockBoard: Board = { id: boardId, name: 'Test Board', description: 'Test Description' };
            jest.spyOn(boardService, 'getBoardById').mockResolvedValue(mockBoard);
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.getBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.getBoardById).toHaveBeenCalledWith(boardId);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockBoard);
        });

        it('should return 404 if board is not found', async () => {
            const boardId = uuidv4();
            jest.spyOn(boardService, 'getBoardById').mockResolvedValue(null);
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.getBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.getBoardById).toHaveBeenCalledWith(boardId);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Board not found' });
        });

        it('should return 400 if boardId is invalid', async () => {
            const boardId = 'invalid-uuid';
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid boardId' }],
            });

            await boardController.getBoard(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid boardId' }] });
        });

        it('should handle errors and return 500 status', async () => {
            const boardId = uuidv4();
            jest.spyOn(boardService, 'getBoardById').mockRejectedValue(new Error('Test error'));
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.getBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.getBoardById).toHaveBeenCalledWith(boardId);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Failed to retrieve board', error: 'Test error' });
        });
    });

    describe('listBoards', () => {
        it('should successfully retrieve a list of boards', async () => {
            const mockBoards: Board[] = [
                { id: uuidv4(), name: 'Test Board 1', description: 'Test Description 1' },
                { id: uuidv4(), name: 'Test Board 2', description: 'Test Description 2' },
            ];
            jest.spyOn(boardService, 'listBoards').mockResolvedValue(mockBoards);

            await boardController.listBoards(mockRequest as Request, mockResponse as Response);

            expect(boardService.listBoards).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockBoards);
        });

        it('should handle errors and return 500 status', async () => {
            jest.spyOn(boardService, 'listBoards').mockRejectedValue(new Error('Test error'));

            await boardController.listBoards(mockRequest as Request, mockResponse as Response);

            expect(boardService.listBoards).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Failed to list boards', error: 'Test error' });
        });
    });

    describe('createBoard', () => {
        it('should successfully create a board', async () => {
            const newBoardData = { name: 'New Board', description: 'New Description' };
            const mockCreatedBoard: Board = { id: uuidv4(), ...newBoardData };
            jest.spyOn(boardService, 'createBoard').mockResolvedValue(mockCreatedBoard);
            mockRequest.body = newBoardData;

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.createBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.createBoard).toHaveBeenCalledWith(newBoardData);
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(mockCreatedBoard);
        });

        it('should return 400 if there are validation errors', async () => {
            mockRequest.body = {};

            (validationResult as jest.Mock).mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Name is required' }],
            });

            await boardController.createBoard(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Name is required' }] });
        });

        it('should handle errors and return 500 status', async () => {
            const newBoardData = { name: 'New Board', description: 'New Description' };
            jest.spyOn(boardService, 'createBoard').mockRejectedValue(new Error('Test error'));
            mockRequest.body = newBoardData;

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.createBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.createBoard).toHaveBeenCalledWith(newBoardData);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Failed to create board', error: 'Test error' });
        });
    });

    describe('updateBoard', () => {
        it('should successfully update a board', async () => {
            const boardId = uuidv4();
            const updateData = { name: 'Updated Board', description: 'Updated Description' };
            const mockUpdatedBoard: Board = { id: boardId, ...updateData };
            jest.spyOn(boardService, 'updateBoard').mockResolvedValue(mockUpdatedBoard);
            mockRequest.params = { boardId: boardId };
            mockRequest.body = updateData;

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.updateBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.updateBoard).toHaveBeenCalledWith(boardId, updateData);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(mockUpdatedBoard);
        });

        it('should return 404 if board is not found', async () => {
            const boardId = uuidv4();
            const updateData = { name: 'Updated Board', description: 'Updated Description' };
            jest.spyOn(boardService, 'updateBoard').mockResolvedValue(null);
            mockRequest.params = { boardId: boardId };
            mockRequest.body = updateData;

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.updateBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.updateBoard).toHaveBeenCalledWith(boardId, updateData);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Board not found' });
        });

        it('should return 400 if boardId is invalid', async () => {
            const boardId = 'invalid-uuid';
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid boardId' }],
            });

            await boardController.updateBoard(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid boardId' }] });
        });

        it('should return 400 if there are validation errors', async () => {
            const boardId = uuidv4();
            mockRequest.params = { boardId: boardId };
            mockRequest.body = { name: '' }; //Empty name should trigger validation error.

            (validationResult as jest.Mock).mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Name cannot be empty' }],
            });

            await boardController.updateBoard(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Name cannot be empty' }] });
        });

        it('should handle errors and return 500 status', async () => {
            const boardId = uuidv4();
            const updateData = { name: 'Updated Board', description: 'Updated Description' };
            jest.spyOn(boardService, 'updateBoard').mockRejectedValue(new Error('Test error'));
            mockRequest.params = { boardId: boardId };
            mockRequest.body = updateData;

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.updateBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.updateBoard).toHaveBeenCalledWith(boardId, updateData);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Failed to update board', error: 'Test error' });
        });
    });

    describe('deleteBoard', () => {
        it('should successfully delete a board', async () => {
            const boardId = uuidv4();
            jest.spyOn(boardService, 'deleteBoard').mockResolvedValue(true);
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.deleteBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.deleteBoard).toHaveBeenCalledWith(boardId);
            expect(mockStatus).toHaveBeenCalledWith(204);
            expect(mockSend).toHaveBeenCalled();
        });

        it('should return 404 if board is not found', async () => {
            const boardId = uuidv4();
            jest.spyOn(boardService, 'deleteBoard').mockResolvedValue(false);
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.deleteBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.deleteBoard).toHaveBeenCalledWith(boardId);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Board not found' });
        });

        it('should return 400 if boardId is invalid', async () => {
            const boardId = 'invalid-uuid';
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid boardId' }],
            });

            await boardController.deleteBoard(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid boardId' }] });
        });

        it('should handle errors and return 500 status', async () => {
            const boardId = uuidv4();
            jest.spyOn(boardService, 'deleteBoard').mockRejectedValue(new Error('Test error'));
            mockRequest.params = { boardId: boardId };

            (validationResult as jest.Mock).mockReturnValue({ isEmpty: () => true });

            await boardController.deleteBoard(mockRequest as Request, mockResponse as Response);

            expect(boardService.deleteBoard).toHaveBeenCalledWith(boardId);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Failed to delete board', error: 'Test error' });
        });
    });
});