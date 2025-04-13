import { Request, Response } from 'express';
import { boardService } from '../../services/board.service';
import { Board } from '../../types/board';
import { validationResult } from 'express-validator';
import { createBoardValidator, updateBoardValidator } from '../../validators/board.validator';

// GET /boards/:boardId
export const getBoard = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId;
    const board = await boardService.getBoard(boardId);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.status(200).json(board);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to get board' });
  }
};

// GET /boards
export const getAllBoards = async (req: Request, res: Response) => {
  try {
    const boards = await boardService.getAllBoards();
    res.status(200).json(boards);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to get boards' });
  }
};

// POST /boards
export const createBoard = async (req: Request, res: Response) => {
  try {
    await createBoardValidator(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const newBoard: Board = req.body;
    const createdBoard = await boardService.createBoard(newBoard);
    res.status(201).json(createdBoard);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to create board' });
  }
};

// PUT /boards/:boardId
export const updateBoard = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId;
    await updateBoardValidator(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const updatedBoard: Board = req.body;
    const board = await boardService.updateBoard(boardId, updatedBoard);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.status(200).json(board);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to update board' });
  }
};

// DELETE /boards/:boardId
export const deleteBoard = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.boardId;
    await boardService.deleteBoard(boardId);
    res.status(204).send();
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to delete board' });
  }
};
