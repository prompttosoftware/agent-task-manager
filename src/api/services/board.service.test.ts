import { BoardService } from '../services/board.service';
import { BoardRepository } from '../../data/board.repository';
import { Board } from '../../models/board.model';
import { ConfigService } from '../../config/config.service';

jest.mock('../../data/board.repository');
jest.mock('../../config/config.service');

describe('BoardService', () => {
  let boardService: BoardService;
  let boardRepository: jest.Mocked<BoardRepository>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    boardRepository = {  // Use an object to mock
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<BoardRepository>;

    // Mock the ConfigService to return some default values
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'app.baseUrl') {
          return 'http://localhost:3000';
        }
        return undefined;
      }),
    } as jest.Mocked<ConfigService>;
    boardService = new BoardService(boardRepository, configService);
  });

  it('should create a board', async () => {
    const mockBoard: Board = {
      id: '1',
      name: 'Test Board',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    boardRepository.create.mockResolvedValue(mockBoard);

    const result = await boardService.createBoard(mockBoard);

    expect(result).toEqual(mockBoard);
    expect(boardRepository.create).toHaveBeenCalledWith(mockBoard);
  });

  it('should get a board by id', async () => {
    const mockBoard: Board = {
      id: '1',
      name: 'Test Board',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    boardRepository.findById.mockResolvedValue(mockBoard);

    const result = await boardService.getBoardById('1');

    expect(result).toEqual(mockBoard);
    expect(boardRepository.findById).toHaveBeenCalledWith('1');
  });

  it('should get all boards', async () => {
    const mockBoards: Board[] = [
      {
        id: '1',
        name: 'Board 1',
        description: 'Description 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Board 2',
        description: 'Description 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    boardRepository.findAll.mockResolvedValue(mockBoards);

    const result = await boardService.getAllBoards();

    expect(result).toEqual(mockBoards);
    expect(boardRepository.findAll).toHaveBeenCalled();
  });

  it('should update a board', async () => {
    const mockBoard: Board = {
      id: '1',
      name: 'Test Board',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    boardRepository.update.mockResolvedValue(mockBoard);

    const updateData = {
      name: 'Updated Board Name',
    };

    const result = await boardService.updateBoard('1', updateData);

    expect(result).toEqual(mockBoard);
    expect(boardRepository.update).toHaveBeenCalledWith('1', updateData);
  });

  it('should delete a board', async () => {
    boardRepository.delete.mockResolvedValue(true);

    const result = await boardService.deleteBoard('1');

    expect(result).toBe(true);
    expect(boardRepository.delete).toHaveBeenCalledWith('1');
  });
});