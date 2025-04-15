import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from '../services/board.service';
import { BoardRepository } from '../../data/board.repository';
import { ConfigService } from '../../config/config.service';
import { Board } from '../../types/board.d';
import { CreateBoardDto } from '../dto/create-board.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Define interfaces for mocking
interface MockBoardRepository {
  createBoard: jest.Mock;
  getBoardById: jest.Mock;
  getAllBoards: jest.Mock;
  updateBoard: jest.Mock;
  deleteBoard: jest.Mock;
}

interface MockConfigService {
  get: jest.Mock;
}

describe('BoardService', () => {  let service: BoardService;  let boardRepository: MockBoardRepository;  let configService: MockConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: BoardRepository,
          useValue: {
            createBoard: jest.fn(),
            getBoardById: jest.fn(),
            getAllBoards: jest.fn(),
            updateBoard: jest.fn(),
            deleteBoard: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    boardRepository = module.get(BoardRepository) as any; // Type assertion
    configService = module.get(ConfigService) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(boardRepository).toBeDefined();
    expect(configService).toBeDefined();
  });

  it('should create a board', async () => {
    const createBoardData: CreateBoardDto = { name: 'Test Board', description: 'Test Description' };
    const createdBoard: Board = { id: 1, ...createBoardData, createdAt: new Date(), updatedAt: new Date() };
    (boardRepository.createBoard as jest.Mock).mockResolvedValue(createdBoard);

    const result = await service.createBoard(createBoardData);

    expect(result).toEqual(createdBoard);
    expect(boardRepository.createBoard).toHaveBeenCalledWith(createBoardData);
  });

  it('should get a board by id', async () => {
    const boardId = 1;
    const board: Board = { id: boardId, name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
    (boardRepository.getBoardById as jest.Mock).mockResolvedValue(board);

    const result = await service.getBoardById(boardId.toString());

    expect(result).toEqual(board);
    expect(boardRepository.getBoardById).toHaveBeenCalledWith(boardId.toString());
  });

  it('should get all boards', async () => {
    const boards: Board[] = [
      { id: 1, name: 'Board 1', description: 'Desc 1', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Board 2', description: 'Desc 2', createdAt: new Date(), updatedAt: new Date() },
    ];
    (boardRepository.getAllBoards as jest.Mock).mockResolvedValue(boards);

    const result = await service.getAllBoards();

    expect(result).toEqual(boards);
    expect(boardRepository.getAllBoards).toHaveBeenCalled();
  });

  it('should update a board', async () => {
    const boardId = 1;
    const updateBoardData: Partial<Board> = { name: 'Updated Name', description: 'Updated Description' };
    const updatedBoard: Board = { id: boardId, ...updateBoardData, createdAt: new Date(), updatedAt: new Date() };
    (boardRepository.updateBoard as jest.Mock).mockResolvedValue(updatedBoard);

    const result = await service.updateBoard(boardId.toString(), updateBoardData);

    expect(result).toEqual(updatedBoard);
    expect(boardRepository.updateBoard).toHaveBeenCalledWith(boardId.toString(), updateBoardData);
  });

  it('should delete a board', async () => {
    const boardId = 1;
    (boardRepository.deleteBoard as jest.Mock).mockResolvedValue(undefined);

    await service.deleteBoard(boardId.toString());

    expect(boardRepository.deleteBoard).toHaveBeenCalledWith(boardId.toString());
  });

  it('should throw NotFoundException if board is not found', async () => {
    const boardId = 999;
    const errorMessage = `Board with ID ${boardId} not found`;
    (boardRepository.getBoardById as jest.Mock).mockResolvedValue(undefined);

    await expect(service.getBoardById(boardId.toString())).rejects.toThrowError(Error);
    await expect(service.getBoardById(boardId.toString())).rejects.toThrowError(errorMessage);
  });

  it('should throw BadRequestException for invalid ID format', async () => {
    const invalidId = 'abc';
    await expect(service.getBoardById(invalidId)).rejects.toThrowError('Invalid ID format');
    await expect(service.updateBoard(invalidId, {name: 'test', description: 'test'})).rejects.toThrowError('Invalid ID format');
    await expect(service.deleteBoard(invalidId)).rejects.toThrowError('Invalid ID format');
  });
});