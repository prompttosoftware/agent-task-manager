import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { validationResult } from 'express-validator';

/**
 * Controller for handling board-related requests.
 */
export class BoardController {
  private readonly boardService: BoardService;

  /**
   * Constructs a BoardController.
   * @param boardService The service for board-related operations.
   */
  constructor(boardService: BoardService) {
    this.boardService = boardService;
  }

  /**
   * Handles the request to get a board by its ID.
   * @param req The Express request object.
   * @param res The Express response object.
   * @returns A JSON response with the board data or an error message.
   */
  async getBoardById(req: Request, res: Response) {
    // Validate the request parameters.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract the board ID from the request parameters.
    const { boardId } = req.params;

    try {
      // Fetch the board from the service.
      const board = await this.boardService.getBoardById(boardId);

      // If the board is not found, return a 404 error.
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }

      // Return the board data.
      res.status(200).json(board);
    } catch (error: any) {
      // Log the error and return a 500 error.
      console.error('Error fetching board:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
