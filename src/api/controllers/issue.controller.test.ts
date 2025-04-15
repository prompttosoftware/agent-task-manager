import { Test, TestingModule } from '@nestjs/testing';
import { IssueController } from './issue.controller';
import { IssueService } from '../services/issue.service';
import { Issue } from '../../types/issue';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('IssueController', () => {
  let controller: IssueController;
  let issueService: IssueService;
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssueController],
      providers: [IssueService],
    }).compile();

    controller = module.get<IssueController>(IssueController);
    issueService = module.get<IssueService>(IssueService);

    app = module.createNestApplication();
    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(issueService).toBeDefined();
  });

  // Add tests for issue controller methods here

  afterEach(async () => {
    await app.close();
  });
});