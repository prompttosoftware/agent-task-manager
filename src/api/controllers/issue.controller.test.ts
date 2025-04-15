import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { IssueController } from '../api/controllers/issue.controller';
import { IssueService } from '../services/issue.service';
import { CreateIssueDto } from '../api/dto/create-issue.dto';
import { UpdateIssueDto } from '../api/dto/update-issue.dto';
import { Issue } from '../models/issue.model';
import { AppModule } from '../../src/app.module';

describe('IssueController', () => {
  let app: INestApplication;
  let controller: IssueController;
  let issueService: IssueService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [IssueController],
      providers: [IssueService],
    }).compile();

    app = moduleFixture.get<INestApplication>(INestApplication);
    controller = moduleFixture.get<IssueController>(IssueController);
    issueService = moduleFixture.get<IssueService>(IssueService);
    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createIssue', () => {
    it('should create an issue', async () => {
      const createIssueDto: CreateIssueDto = {
        summary: 'Test Issue',
        description: 'Test Description',
        issuetype: { name: 'Bug' },
      };
      const issue: Issue = {
        id: '1',
        summary: 'Test Issue',
        description: 'Test Description',
        issuetype: { name: 'Bug' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(issueService, 'createIssue').mockResolvedValue(issue);

      const response = await request(app.getHttpServer())
        .post('/issue')
        .send(createIssueDto)
        .expect(201);

      expect(response.body).toEqual(issue);
      expect(issueService.createIssue).toHaveBeenCalledWith(createIssueDto);
    });
  });

  describe('getIssueById', () => {
    it('should get an issue by id', async () => {
      const issueId = '1';
      const issue: Issue = {
        id: '1',
        summary: 'Test Issue',
        description: 'Test Description',
        issuetype: { name: 'Bug' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(issueService, 'getIssueById').mockResolvedValue(issue);

      const response = await request(app.getHttpServer())
        .get(`/issue/${issueId}`)
        .expect(200);

      expect(response.body).toEqual(issue);
      expect(issueService.getIssueById).toHaveBeenCalledWith(issueId);
    });
  });

  describe('getAllIssues', () => {
    it('should get all issues', async () => {
      const issues: Issue[] = [
        {
          id: '1',
          summary: 'Issue 1',
          description: 'Desc 1',
          issuetype: { name: 'Bug' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          summary: 'Issue 2',
          description: 'Desc 2',
          issuetype: { name: 'Task' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      jest.spyOn(issueService, 'getAllIssues').mockResolvedValue(issues);

      const response = await request(app.getHttpServer())
        .get('/issue')
        .expect(200);

      expect(response.body).toEqual(issues);
      expect(issueService.getAllIssues).toHaveBeenCalled();
    });
  });

  describe('updateIssue', () => {
    it('should update an issue', async () => {
      const issueId = '1';
      const updateIssueDto = { summary: 'Updated Issue', description: 'Updated Description' };
      const existingIssue: Issue = {
        id: issueId,
        summary: 'Test Issue',
        description: 'Test Description',
        issuetype: { name: 'Bug' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedIssue: Issue = { ...existingIssue, ...updateIssueDto, updatedAt: new Date() };
      jest.spyOn(issueService, 'updateIssue').mockResolvedValue(updatedIssue);

      const response = await request(app.getHttpServer())
        .put(`/issue/${issueId}`)
        .send(updateIssueDto)
        .expect(200);

      expect(response.body).toEqual(updatedIssue);
      expect(issueService.updateIssue).toHaveBeenCalledWith(issueId, updateIssueDto);
    });
  });

  describe('deleteIssue', () => {
    it('should delete an issue', async () => {
      const issueId = '1';
      jest.spyOn(issueService, 'deleteIssue').mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/issue/${issueId}`)
        .expect(204);

      expect(issueService.deleteIssue).toHaveBeenCalledWith(issueId);
    });
  });
});