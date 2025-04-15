import request from 'supertest';
import { Express } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IssueController } from '../../../src/api/controllers/issue.controller';
import { IssueService } from '../../../src/api/services/issue.service';
import { Issue } from '../../../src/api/types/issue';
import { AppModule } from '../../../src/app.module';

const mockIssueService = () => ({
  addIssue: jest.fn(),
  getIssueById: jest.fn(),
  // Mock other service methods as needed based on controller usage
});

describe('Issue Controller', () => {
  let app: INestApplication;
  let issueService: ReturnType<typeof mockIssueService>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [IssueController],
      providers: [
        {
          provide: IssueService,
          useFactory: mockIssueService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    issueService = moduleFixture.get<IssueService>(IssueService) as ReturnType<typeof mockIssueService>;
  });

  it('should create an issue', async () => {
    const mockCreatedIssue: Issue = { issueKey: '1', summary: 'Test Issue', description: 'Test Description', boardId: '1' };
    (issueService.addIssue as jest.Mock).mockResolvedValue(mockCreatedIssue);

    const response = await request(app.getHttpServer())
      .post('/api/issues')
      .send({ issueKey: '1', summary: 'Test Issue', description: 'Test Description', boardId: '1' })
      .expect(201);

    expect(response.body).toEqual(mockCreatedIssue);
    expect(issueService.addIssue).toHaveBeenCalledWith({ issueKey: '1', summary: 'Test Issue', description: 'Test Description', boardId: '1' });
  });

  it('should get an issue by id', async () => {
    const mockIssue: Issue = { issueKey: '1', summary: 'Test Issue', description: 'Test Description', boardId: '1'};
    (issueService.getIssueById as jest.Mock).mockResolvedValue(mockIssue);

    const response = await request(app.getHttpServer())
      .get('/api/issues/1')
      .expect(200);

    expect(response.body).toEqual(mockIssue);
    expect(issueService.getIssueById).toHaveBeenCalledWith('1');
  });
});