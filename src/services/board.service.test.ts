import { BoardServiceImpl } from './board.service';
import * as db from '../data/db';
import { Board } from '../types/board';

jest.mock('../data/db'); // Mock the database module

describe('BoardService', () => {
  let boardService: BoardServiceImpl;

  beforeEach(() => {
    boardService = new BoardServiceImpl();
    (db.getAllBoards as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBoards', () => {
    it('should return an array of boards when boards exist', async () => {
      const mockBoards: Board[] = [
        { id: '1', name: 'Board 1', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Board 2', createdAt: new Date(), updatedAt: new Date() },
      ];
      (db.getAllBoards as jest.Mock).mockResolvedValue(mockBoards);

      const getAllBoards = boardService.getAllBoards;
      const boards = await getAllBoards();
      expect(boards).toEqual(mockBoards);
      expect(db.getAllBoards).toHaveBeenCalled();
    });

    it('should return an empty array when no boards exist', async () => {
      (db.getAllBoards as jest.Mock).mockResolvedValue([]);
      const getAllBoards = boardService.getAllBoards;
      const boards = await getAllBoards();
      expect(boards).toEqual([]);
      expect(db.getAllBoards).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to get boards';
      (db.getAllBoards as jest.Mock).mockRejectedValue(new Error(errorMessage));
      const getAllBoards = boardService.getAllBoards;
      await expect(getAllBoards()).rejects.toThrow(errorMessage);
      expect(db.getAllBoards).toHaveBeenCalled();
    });
  });
});
