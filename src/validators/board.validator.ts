// src/validators/board.validator.ts
import { body, param, validationResult } from 'express-validator';

export const createBoardValidator = [
    body('name').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
];

export const updateBoardValidator = [
    param('boardId').isUUID().withMessage('Invalid boardId format'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
];