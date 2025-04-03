// src/api/controllers/board.controller.ts

import { Request, Response, NextFunction } from 'express';
import { validationResult, check, Result, ValidationError } from 'express-validator';
import * as boardService from '../../services/board.service';
import { Board } from '../../types/board';

// Custom Error Classes
class InputValidationError extends Error {
    statusCode: number;
    errors: ValidationError[]; // Store validation errors

    constructor(errors: ValidationError[]) {
        super('Input validation failed');
        this.statusCode = 400;
        this.errors = errors;
        this.name = 'InputValidationError'; //For easier identification
        Object.setPrototypeOf(this, InputValidationError.prototype);
    }
}

class BoardNotFoundError extends Error {
    statusCode: number;
    constructor(message: string = 'Board not found') {
        super(message);
        this.statusCode = 404;
        this.name = 'BoardNotFoundError';
        Object.setPrototypeOf(this, BoardNotFoundError.prototype);
    }
}

class InternalServerError extends Error {
    statusCode: number;
    constructor(message: string = 'Internal Server Error') {
        super(message);
        this.statusCode = 500;
        this.name = 'InternalServerError';
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}

// Helper function to check if the error is a custom error and assign appropriate status code.
const handleCustomErrors = (err: Error, res: Response) => {
    if (err instanceof InputValidationError) {
        return res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
            errors: err.errors, //Include validation errors for client use
        });
    }
    if (err instanceof BoardNotFoundError) {
        return res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
        });
    }
    if (err instanceof InternalServerError) {
        return res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
        });
    }
};

// Create Board Controller
export const createBoard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Input Validation using express-validator
        await Promise.all([
            check('name')
                .notEmpty().withMessage('Name is required')
                .isString().withMessage('Name must be a string')
                .trim()
                .escape() // Sanitize input to prevent XSS
                .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters') // Example length validation
                .run(req),
            check('description')
                .optional() // Description is optional
                .isString().withMessage('Description must be a string')
                .trim()
                .escape()
                .isLength({ max: 200 }).withMessage('Description must be at most 200 characters') // Example length validation
                .run(req),
        ]);

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            throw new InputValidationError(errors.array()); // Throw custom error
        }

        // 2. Call Board Service with Validated Data
        const { name, description } = req.body;
        const newBoard: Board = await boardService.createBoard({ name, description });

        // 3. Send Success Response
        res.status(201).json(newBoard); // 201 Created

    } catch (err: any) { // Type 'any' to catch any kind of error from service and other exceptions
        // 4. Error Handling
        if (err instanceof InputValidationError || err instanceof BoardNotFoundError || err instanceof InternalServerError) {
            // Handle custom errors
            return handleCustomErrors(err, res);
        }

        console.error('Unexpected error creating board:', err); // Log the error for debugging.
        // 5. Default Internal Server Error
        res.status(500).json({
            error: 'InternalServerError',
            message: 'An unexpected error occurred',
        });
        //next(err); // Pass to error handling middleware if available. If no middleware, will result in a default error response by express
    }
};


// Get Board by ID
export const getBoardById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Input Validation - Validate the board ID
        await check('id')
            .isInt().withMessage('ID must be an integer') //Check if it is an integer.
            .toInt() //Convert id to integer
            .run(req);

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            throw new InputValidationError(errors.array());
        }

        const boardId = parseInt(req.params.id, 10); // Get the ID from the URL parameters.  Ensure to parse it to a number
        if (isNaN(boardId)) {
            throw new InputValidationError([{
                type: 'field',
                value: req.params.id,
                msg: 'Invalid board ID format',
                path: 'id',
                location: 'params',
            }]);
        }

        // 2. Call Board Service
        const board: Board | null = await boardService.getBoardById(boardId);

        // 3. Handle Service Response
        if (!board) {
            throw new BoardNotFoundError(); // Throw custom error for not found
        }

        // 4. Send Success Response
        res.status(200).json(board); // 200 OK

    } catch (err: any) {
        // 5. Error Handling
        if (err instanceof InputValidationError || err instanceof BoardNotFoundError || err instanceof InternalServerError) {
            return handleCustomErrors(err, res);
        }

        console.error('Unexpected error getting board by ID:', err);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'An unexpected error occurred',
        });
        //next(err); // Pass to error handling middleware
    }
};


// Update Board
export const updateBoard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Input Validation (ID and update data)
        // Validate board ID
        await check('id')
            .isInt().withMessage('ID must be an integer')
            .toInt()
            .run(req);

        // Validate update data (similar to createBoard, but optional fields)
        await Promise.all([
            check('name')
                .optional() // Name is optional in updates
                .isString().withMessage('Name must be a string')
                .trim()
                .escape()
                .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters')
                .run(req),
            check('description')
                .optional()
                .isString().withMessage('Description must be a string')
                .trim()
                .escape()
                .isLength({ max: 200 }).withMessage('Description must be at most 200 characters')
                .run(req),
        ]);

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            throw new InputValidationError(errors.array());
        }

        const boardId = parseInt(req.params.id, 10); // Get ID from URL params and parse to integer.
        if (isNaN(boardId)) {
            throw new InputValidationError([{
                type: 'field',
                value: req.params.id,
                msg: 'Invalid board ID format',
                path: 'id',
                location: 'params',
            }]);
        }

        // 2. Call Board Service
        const { name, description } = req.body;
        const updatedBoard: Board | null = await boardService.updateBoard(boardId, { name, description });

        // 3. Handle Service Response
        if (!updatedBoard) {
            throw new BoardNotFoundError('Board not found for update');
        }

        // 4. Send Success Response
        res.status(200).json(updatedBoard); // 200 OK

    } catch (err: any) {
        // 5. Error Handling
        if (err instanceof InputValidationError || err instanceof BoardNotFoundError || err instanceof InternalServerError) {
            return handleCustomErrors(err, res);
        }

        console.error('Unexpected error updating board:', err);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'An unexpected error occurred',
        });
        //next(err); // Pass to error handling middleware
    }
};


// Delete Board
export const deleteBoard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Input Validation
        await check('id')
            .isInt().withMessage('ID must be an integer')
            .toInt()
            .run(req);

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            throw new InputValidationError(errors.array());
        }

        const boardId = parseInt(req.params.id, 10); // Get ID from URL and parse.
         if (isNaN(boardId)) {
            throw new InputValidationError([{
                type: 'field',
                value: req.params.id,
                msg: 'Invalid board ID format',
                path: 'id',
                location: 'params',
            }]);
        }


        // 2. Call Board Service
        const deletedBoard: boolean = await boardService.deleteBoard(boardId);

        // 3. Handle Service Response
        if (!deletedBoard) {
            throw new BoardNotFoundError('Board not found for deletion');
        }

        // 4. Send Success Response
        res.status(204).send(); // 204 No Content (Successful delete)

    } catch (err: any) {
        // 5. Error Handling
        if (err instanceof InputValidationError || err instanceof BoardNotFoundError || err instanceof InternalServerError) {
            return handleCustomErrors(err, res);
        }

        console.error('Unexpected error deleting board:', err);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'An unexpected error occurred',
        });
        //next(err); // Pass to error handling middleware
    }
};
