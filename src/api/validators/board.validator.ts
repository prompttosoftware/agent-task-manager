import { param } from 'express-validator';

export const boardIdValidator = [
  param('boardId')
    .isInt({ min: 1 })
    .withMessage('Board ID must be a number greater than 0'),
];