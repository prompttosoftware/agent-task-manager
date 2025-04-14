import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as boardService from '../api/services/board.service';
import { CreateBoardData } from '../types/board';

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

  if (!boardId) {
    return res.status(400).json({ message: 'Board ID is required' });
  }

  try {
    await boardService.deleteBoard(boardId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting board in controller:', error);
    res.status(500).json({ message: 'Failed to delete board' });
  }
};