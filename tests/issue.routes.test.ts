import request from 'supertest';
import express, { Application } from 'express';
import issueRoutes from '../src/routes/issue.routes';
import { IssueController } from '../src/api/issue.controller';

jest.mock('../src/api/issue.controller');

const mockIssueController = {
  createIssue: jest.fn(),
  getIssue: jest.fn(),
  deleteIssue: jest.fn(),
};

(IssueController as jest.Mock).mockImplementation(() => mockIssueController);

const app: Application = express();
app.use(express.json()); // Add this line to parse JSON bodies
app.use(issueRoutes);

describe('Issue Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call createIssue when POST /rest/api/2/issue is called', async () => {
    await request(app).post('/rest/api/2/issue').send({ summary: 'Test issue' }).expect(200);
    expect(mockIssueController.createIssue).toHaveBeenCalled();
  });

  it('should call getIssue when GET /rest/api/2/issue/:issueKey is called', async () => {
    const issueKey = 'TEST-123';
    await request(app).get(`/rest/api/2/issue/${issueKey}`).expect(200);
    expect(mockIssueController.getIssue).toHaveBeenCalledWith(issueKey);
  });

  it('should call deleteIssue when DELETE /rest/api/2/issue/:issueKey is called', async () => {
    const issueKey = 'TEST-123';
    await request(app).delete(`/rest/api/2/issue/${issueKey}`).expect(200);
    expect(mockIssueController.deleteIssue).toHaveBeenCalledWith(issueKey);
  });
});
