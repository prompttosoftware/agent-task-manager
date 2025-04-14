import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as boardService from '../api/services/board.service';
import { CreateBoardData } from '../types/board';
import { validateBoardId } from '../api/validators/board.validator';

export const createBoard = async (req: Request, res: Response) => {  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description } = req.body as CreateBoardData;
    const newBoard = await boardService.createBoard({
      name,
      description,
    });
    res.status(201).json(newBoard);
  } catch (error: any) {
    console.error('Error creating board in controller:', error);
    res.status(500).json({ message: 'Failed to create board' });
  }
};

export const deleteBoard = async (req: Request, res: Response) => {
  const boardId = req.params.boardId;

  try {
    await boardService.deleteBoard(boardId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting board in controller:', error);
    res.status(500).json({ message: 'Failed to delete board' });
  }
};

export const getBoard = async (req: Request, res: Response) => {
    const boardId = req.params.boardId;

    try {
        const board = await boardService.getBoard(boardId);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        res.status(200).json(board);
    } catch (error: any) {
        console.error('Error getting board in controller:', error);
        res.status(500).json({ message: 'Failed to get board' });
    }
};
