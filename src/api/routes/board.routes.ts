// src/api/routes/board.routes.ts
import { Router, Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { BoardCreateDto, BoardUpdateDto } from '../types/board.d';
import { StatusCodes } from 'http-status-codes';

const router = Router();
const boardService = new BoardService();

// GET /boards/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    if (isNaN(boardId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid board ID' });
    }
    const board = await boardService.getBoard(boardId);
    if (!board) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found' });
    }
    res.status(StatusCodes.OK).json(board);
  } catch (error: any) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to get board' });
  }
});

// GET /boards
router.get('/', async (req: Request, res: Response) => {
  try {
    const boards = await boardService.listBoards();
    res.status(StatusCodes.OK).json(boards);
  } catch (error: any) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to list boards' });
  }
});

// POST /boards
router.post('/', async (req: Request, res: Response) => {
  try {
    const boardData: BoardCreateDto = req.body;
    const newBoard = await boardService.createBoard(boardData);
    res.status(StatusCodes.CREATED).json(newBoard);
  } catch (error: any) {
    console.error(error);
    res.status(error.status || StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to create board' });
  }
});

// PUT /boards/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    if (isNaN(boardId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid board ID' });
    }
    const boardData: BoardUpdateDto = req.body;
    const updatedBoard = await boardService.updateBoard(boardId, boardData);
    if (!updatedBoard) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found' });
    }
    res.status(StatusCodes.OK).json(updatedBoard);
  } catch (error: any) {
    console.error(error);
    res.status(error.status || StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to update board' });
  }
});

// DELETE /boards/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    if (isNaN(boardId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid board ID' });
    }
    await boardService.deleteBoard(boardId);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error: any) {
    console.error(error);
    res.status(error.status || StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Failed to delete board' });
  }
});

export default router;
