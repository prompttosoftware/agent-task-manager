import { Test, TestingModule } from '@nestjs/testing';
import { IssueController } from './issue.controller';
import { IssueService } from '../services/issue.service';
import { CreateIssueDto } from '../dto/create-issue.dto';
import { Issue } from '../types/issue';
import { Request, Response } from 'express';
import { NotFoundException } from '@nestjs/common';


describe('IssueController', () => {
  let controller: IssueController;
  let issueService: IssueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssueController],
      providers: [IssueService],
    }).compile();

    controller = module.get<IssueController>(IssueController);
    issueService = module.get<IssueService>(IssueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createIssue', () => {
    it('should create an issue', async () => {
      const createIssueDto: CreateIssueDto = {
        title: 'Test Issue',
        description: 'Test Description',
        boardId: '1',
      };
      const createdIssue: Issue = {
        id: '1',
        ...createIssueDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(issueService, 'create').mockResolvedValue(createdIssue);
      const req = { body: createIssueDto } as Request;
      const res = { json: jest.fn() } as unknown as Response;
      const result = await controller.createIssue(req, res);
      expect(result).toEqual(createdIssue);
      expect(issueService.create).toHaveBeenCalledWith(createIssueDto);
    });
  });

  describe('getIssue', () => {
    it('should return an issue', async () => {
      const issueId = '1';
      const mockIssue: Issue = {
        id: issueId,
        title: 'Test Issue',
        description: 'Test Description',
        boardId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(issueService, 'findById').mockResolvedValue(mockIssue);
      const req = { params: { id: issueId } } as unknown as Request;
      const res = { json: jest.fn() } as unknown as Response;
      const result = await controller.getIssue(req, res);
      expect(result).toEqual(mockIssue);
      expect(issueService.findById).toHaveBeenCalledWith(issueId);
    });

    it('should throw NotFoundException if issue is not found', async () => {
      const issueId = '2';
      jest.spyOn(issueService, 'findById').mockRejectedValue(new NotFoundException());
      const req = { params: { id: issueId } } as unknown as Request;
      const res = { json: jest.fn() } as unknown as Response;
      await expect(controller.getIssue(req, res)).rejects.toThrow(NotFoundException);
      expect(issueService.findById).toHaveBeenCalledWith(issueId);
    });
  });

  // Add tests for issue retrieval, and updates here
});
