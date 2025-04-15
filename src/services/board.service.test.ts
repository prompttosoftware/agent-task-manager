import { BoardService } from './board.service';
import * as boardRepository from '../data/board.repository';  // Import the module
import { mockBoard } from '../data/mocks/mock.board.repository';

jest.mock('../data/board.repository');  // Mock the entire module

describe('BoardService', () => {
  let boardService: BoardService;
  let mockBoardRepository: jest.Mocked<typeof boardRepository>;

  beforeEach(() => {
    mockBoardRepository = boardRepository as jest.Mocked<typeof boardRepository>; //telling TS that boardRepository is mocked
    boardService = new BoardService(mockBoardRepository); // Inject the mocked repository
    jest.resetAllMocks();
  });

  it('should return a board if it exists', async () => {
    const boardId = '1';
    const mockBoardData = mockBoard();
    mockBoardRepository.getBoardById.mockResolvedValue(mockBoardData);

    const board = await boardService.getBoardById(boardId);

    expect(board).toEqual(mockBoardData);
    expect(mockBoardRepository.getBoardById).toHaveBeenCalledWith(1);
  });

  it('should return null if board does not exist', async () => {
    const boardId = '999';
    mockBoardRepository.getBoardById.mockResolvedValue(null);

    const board = await boardService.getBoardById(boardId);

    expect(board).toBeNull();
    expect(mockBoardRepository.getBoardById).toHaveBeenCalledWith(999);
  });

  it('should return null if boardId is not a number', async () => {
    const boardId = 'abc';

    const board = await boardService.getBoardById(boardId);

    expect(board).toBeNull();
    expect(mockBoardRepository.getBoardById).not.toHaveBeenCalled();
  });

  it('should throw an error if the repository throws an error', async () => {
    const boardId = '1';
    const errorMessage = 'Database error';
    mockBoardRepository.getBoardById.mockRejectedValue(new Error(errorMessage));

    await expect(boardService.getBoardById(boardId)).rejects.toThrow(errorMessage);
    expect(mockBoardRepository.getBoardById).toHaveBeenCalledWith(1);
  });
});