import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service'; // Corrected path
import { BoardRepository } from '../../data/board.repository';
import { ConfigService } from '@nestjs/config'; // Using @nestjs/config
import { Board } from '../../types/board.d';
import { CreateBoardDto } from '../dto/create-board.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';

describe('BoardService', () => {
    let service: BoardService;
    let boardRepository: Repository<Board>;
    let configService: ConfigService;

    const mockBoardRepository = () => ({    
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
    });

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'someConfigKey') {
                return 'testValue'; // Example config value
            }
            return null;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule],
            providers: [
                BoardService,
                {
                    provide: getRepositoryToken(Board),
                    useFactory: mockBoardRepository,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<BoardService>(BoardService);
        boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(boardRepository).toBeDefined();
        expect(configService).toBeDefined();
    });

    it('should create a board', async () => {
        const createBoardData: CreateBoardDto = { name: 'Test Board', description: 'Test Description' };
        const createdBoard: Board = { id: '1', ...createBoardData, createdAt: new Date(), updatedAt: new Date() };
        (boardRepository.save as jest.Mock).mockResolvedValue(createdBoard);

        const result = await service.createBoard(createBoardData);

        expect(result).toEqual(createdBoard);
        expect(boardRepository.save).toHaveBeenCalledWith(expect.objectContaining(createBoardData));
    });

    it('should get a board by id', async () => {
        const boardId = 1; // Changed to number
        const board: Board = { id: '1', name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
        (boardRepository.findOne as jest.Mock).mockResolvedValue(board);

        const result = await service.getBoardById(boardId.toString()); // Pass string to match service

        expect(result).toEqual(board);
        expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: boardId.toString() } });
    });

    it('should get all boards', async () => {
        const boards: Board[] = [
            { id: '1', name: 'Board 1', description: 'Desc 1', createdAt: new Date(), updatedAt: new Date() },
            { id: '2', name: 'Board 2', description: 'Desc 2', createdAt: new Date(), updatedAt: new Date() },
        ];
        (boardRepository.find as jest.Mock).mockResolvedValue(boards);

        const result = await service.getAllBoards();

        expect(result).toEqual(boards);
        expect(boardRepository.find).toHaveBeenCalled();
    });

    it('should update a board', async () => {
        const boardId = 1; // Changed to number
        const updateBoardData: Partial<Board> = { name: 'Updated Name', description: 'Updated Description' };
        const existingBoard: Board = { id: '1', name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
        const updatedBoard: Board = { ...existingBoard, ...updateBoardData, updatedAt: new Date() };
        (boardRepository.findOne as jest.Mock).mockResolvedValue(existingBoard);
        (boardRepository.save as jest.Mock).mockResolvedValue(updatedBoard);

        const result = await service.updateBoard(boardId.toString(), updateBoardData); // Pass string

        expect(result).toEqual(updatedBoard);
        expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: boardId.toString() } });
        expect(boardRepository.save).toHaveBeenCalledWith(expect.objectContaining(updatedBoard));
    });

    it('should delete a board', async () => {
        const boardId = 1; // Changed to number
        const existingBoard: Board = { id: '1', name: 'Test Board', description: 'Test Description', createdAt: new Date(), updatedAt: new Date() };
        (boardRepository.findOne as jest.Mock).mockResolvedValue(existingBoard);
        (boardRepository.remove as jest.Mock).mockResolvedValue(existingBoard);

        await service.deleteBoard(boardId.toString()); // Pass string

        expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: boardId.toString() } });
        expect(boardRepository.remove).toHaveBeenCalledWith(existingBoard);
    });

    it('should throw NotFoundException if board is not found', async () => {
        const boardId = 999; // Changed to number
        (boardRepository.findOne as jest.Mock).mockResolvedValue(undefined);

        await expect(service.getBoardById(boardId.toString())).rejects.toThrowError(NotFoundException);
        expect(boardRepository.findOne).toHaveBeenCalledWith({ where: { id: boardId.toString() } });
    });

    it('should throw BadRequestException for invalid ID format', async () => {
        const invalidId = 'abc';
        await expect(service.getBoardById(invalidId)).rejects.toThrowError(BadRequestException);
        await expect(service.updateBoard(invalidId, { name: 'test', description: 'test' })).rejects.toThrowError(BadRequestException);
        await expect(service.deleteBoard(invalidId)).rejects.toThrowError(BadRequestException);
    });
});