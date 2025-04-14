import { BoardService } from './board.service';
import { BoardRepository } from '../data/board.repository';
import { mockBoard } from '../data/mocks/mock.board.repository';

jest.mock('../data/board.repository');

describe('BoardService', () => {
  let boardService: BoardService;
  let boardRepository: BoardRepository;

  beforeEach(() => {
    boardRepository = new BoardRepository() as jest.Mocked<BoardRepository>;
    boardService = new BoardService(boardRepository);
    jest.resetAllMocks();
  });

  it('should return a board if it exists', async () => {
    const boardId = '1';
    const mockBoardData = mockBoard();
    (boardRepository.getBoardById as jest.Mock).mockResolvedValue(mockBoardData);

    const board = await boardService.getBoardById(boardId);

    expect(board).toEqual(mockBoardData);
    expect(boardRepository.getBoardById).toHaveBeenCalledWith(1);
  });

  it('should return null if board does not exist', async () => {
    const boardId = '999';
    (boardRepository.getBoardById as jest.Mock).mockResolvedValue(null);

    const board = await boardService.getBoardById(boardId);

    expect(board).toBeNull();
    expect(boardRepository.getBoardById).toHaveBeenCalledWith(999);
  });

  it('should return null if boardId is not a number', async () => {
    const boardId = 'abc';

    const board = await boardService.getBoardById(boardId);

    expect(board).toBeNull();
    expect(boardRepository.getBoardById).not.toHaveBeenCalled();
  });

  it('should throw an error if the repository throws an error', async () => {
    const boardId = '1';
    const errorMessage = 'Database error';
    (boardRepository.getBoardById as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(boardService.getBoardById(boardId)).rejects.toThrow(errorMessage);
    expect(boardRepository.getBoardById).toHaveBeenCalledWith(1);
  });
});
