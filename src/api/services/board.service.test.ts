import { BoardService } from './board.service';
import { BoardRepository } from '../data/board.repository'; // Import the interface
import { Board } from '../../types/board.d';

// Explicitly mock the functions used from boardRepository
const mockBoardRepository = {
    getBoardById: jest.fn(),
    createBoard: jest.fn(),
    getAllBoards: jest.fn(),
    updateBoard: jest.fn(),
    deleteBoard: jest.fn(),
}

describe('BoardService', () => {
    let boardService: BoardService;

    beforeEach(() => {
        jest.clearAllMocks();
        boardService = new BoardService(mockBoardRepository as BoardRepository);
    });

    it('should return a board if it exists', async () => {
        const boardId = '1';
        const mockBoardData: Board = { id: '1', name: 'Test Board', createdAt: new Date(), updatedAt: new Date() };
        mockBoardRepository.getBoardById.mockResolvedValue(mockBoardData);

        const board = await boardService.getBoardById(boardId);

        expect(board).toEqual(mockBoardData);
        expect(mockBoardRepository.getBoardById).toHaveBeenCalledWith(1); // Corrected assertion:  ID should be the number 1
    });

    it('should return null if board does not exist', async () => {
        const boardId = '999';
        mockBoardRepository.getBoardById.mockResolvedValue(null);

        const board = await boardService.getBoardById(boardId);

        expect(board).toBeNull();
        expect(mockBoardRepository.getBoardById).toHaveBeenCalledWith(999); // Corrected assertion: ID should be the number 999
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
        expect(mockBoardRepository.getBoardById).toHaveBeenCalledWith(1); // Corrected assertion: ID should be the number 1
    });
});