import { BoardService } from './board.service';
import * as boardRepository from '../data/board.repository';  // Import the module
import { mockBoard } from '../data/mocks/mock.board.repository';
import { Board } from '../../types/board.d';

jest.mock('../data/board.repository');  // Mock the entire module

describe('BoardService', () => {
  let boardService: BoardService;
  let mockBoardRepository: jest.Mocked<typeof boardRepository>;

  beforeEach(() => {
    mockBoardRepository = boardRepository as jest.Mocked<typeof boardRepository>; //telling TS that boardRepository is mocked
    boardService = new BoardService(mockBoardRepository as any); // Inject the mocked repository
    jest.resetAllMocks();
  });

  it('should return a board if it exists', async () => {
    const boardId = '1';
    const mockBoardData: Board = { id: '1', name: 'Test Board', createdAt: new Date(), updatedAt: new Date() };
    mockBoardRepository.findOne.mockResolvedValue(mockBoardData);

    const board = await boardService.findBoardById(boardId);

    expect(board).toEqual(mockBoardData);
    expect(mockBoardRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should return null if board does not exist', async () => {
    const boardId = '999';
    mockBoardRepository.findOne.mockResolvedValue(null);

    const board = await boardService.findBoardById(boardId);

    expect(board).toBeNull();
    expect(mockBoardRepository.findOne).toHaveBeenCalledWith({ where: { id: '999' } });
  });

  it('should return null if boardId is not a number', async () => {
    const boardId = 'abc';

    const board = await boardService.findBoardById(boardId);

    expect(board).toBeNull();
    expect(mockBoardRepository.findOne).not.toHaveBeenCalled();
  });

  it('should throw an error if the repository throws an error', async () => {
    const boardId = '1';
    const errorMessage = 'Database error';
    mockBoardRepository.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(boardService.findBoardById(boardId)).rejects.toThrow(errorMessage);
    expect(mockBoardRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});