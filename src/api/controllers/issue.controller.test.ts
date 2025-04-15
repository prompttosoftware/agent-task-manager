import { Test, TestingModule } from '@nestjs/testing';
import { IssueController } from './issue.controller';
import { IssueService } from '../services/issue.service';
import { Express } from 'express';
import { setupApp } from '../../../src/app';
import request from 'supertest';
import { Issue } from '../../types/issue';

describe('IssueController', () => {
  let controller: IssueController;
  let app: Express;
  let issueService: IssueService;

  beforeAll(async () => {
    app = await setupApp();
  });

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

  it('should create an issue', async () => {
    const createIssueDto = { summary: 'Test Issue', description: 'Test Description' };
    const createdIssue: Issue = { id: '1', ...createIssueDto, epicId: 'epic-1', boardId: 'board-1' };
    jest.spyOn(issueService, 'createIssue').mockResolvedValue(createdIssue);

    const response = await request(app)
      .post('/api/issues')
      .send(createIssueDto);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(createdIssue);
    expect(issueService.createIssue).toHaveBeenCalledWith(createIssueDto);
  });

  it('should get an issue by id', async () => {
    const issueId = '1';
    const mockIssue: Issue = { id: issueId, summary: 'Test Issue', description: 'Test Description', epicId: 'epic-1', boardId: 'board-1' };
    jest.spyOn(issueService, 'getIssueById').mockResolvedValue(mockIssue);

    const response = await request(app)
      .get(`/api/issues/${issueId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockIssue);
    expect(issueService.getIssueById).toHaveBeenCalledWith(issueId);
  });

  it('should return 404 if issue not found', async () => {
    const issueId = '999';
    jest.spyOn(issueService, 'getIssueById').mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/issues/${issueId}`);

    expect(response.status).toBe(404);
    expect(issueService.getIssueById).toHaveBeenCalledWith(issueId);
  });
});
