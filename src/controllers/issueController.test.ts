import { describe, it, expect, vi, beforeEach } from 'vitest';
import { issueController } from '../controllers/issueController';
import { issueService } from '../services/issueService';
import { Request, Response } from 'express';
import { Issue } from '../types/issue';

// Mock the issueService
vi.mock('../services/issueService');

describe('issueController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('createIssue', () => {
    it('should return 400 if issue summary is missing', async () => {
      req = { body: {} };
      await issueController.createIssue(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Issue summary is required' });
    });

    it('should return 201 and the new issue if issue is created successfully', async () => {
      const issue: Issue = { summary: 'Test issue', key: 'TEST-123' } as Issue;
      const createdIssue: Issue = { ...issue, id: '123' };
      (issueService.createIssue as vi.Mock).mockResolvedValue(createdIssue);
      req = { body: issue };

      await issueController.createIssue(req as Request, res as Response);

      expect(issueService.createIssue).toHaveBeenCalledWith(issue);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdIssue);
    });

    it('should return 500 if issue creation fails', async () => {
      const issue: Issue = { summary: 'Test issue', key: 'TEST-123' } as Issue;
      const errorMessage = 'Failed to create issue';
      (issueService.createIssue as vi.Mock).mockRejectedValue(new Error(errorMessage));
      req = { body: issue };

      await issueController.createIssue(req as Request, res as Response);

      expect(issueService.createIssue).toHaveBeenCalledWith(issue);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getIssue', () => {
    it('should return 400 if issueId is missing', async () => {
      req = { params: {} };
      await issueController.getIssue(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Issue ID is required' });
    });

    it('should return 404 if issue is not found', async () => {
      const issueId = '123';
      (issueService.getIssue as vi.Mock).mockResolvedValue(undefined);
      req = { params: { issueId } };

      await issueController.getIssue(req as Request, res as Response);

      expect(issueService.getIssue).toHaveBeenCalledWith(issueId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Issue not found' });
    });

    it('should return 200 and the issue if found', async () => {
      const issueId = '123';
      const issue: Issue = { id: issueId, summary: 'Test issue', key: 'TEST-123' };
      (issueService.getIssue as vi.Mock).mockResolvedValue(issue);
      req = { params: { issueId } };

      await issueController.getIssue(req as Request, res as Response);

      expect(issueService.getIssue).toHaveBeenCalledWith(issueId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(issue);
    });

    it('should return 500 if getting issue fails', async () => {
      const issueId = '123';
      const errorMessage = 'Failed to get issue';
      (issueService.getIssue as vi.Mock).mockRejectedValue(new Error(errorMessage));
      req = { params: { issueId } };

      await issueController.getIssue(req as Request, res as Response);

      expect(issueService.getIssue).toHaveBeenCalledWith(issueId);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  // Test cases for linkIssue
  describe('linkIssue', () => {
    it('should return 400 if required parameters are missing', async () => {
      req = { params: { issueId: '1' }, body: {} };
      await issueController.linkIssue(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required parameters' });
    });

    it('should return 200 if issue is linked successfully', async () => {
      const issueId = '1';
      const linkedIssueId = '2';
      const linkType = 'relates';
      req = { params: { issueId }, body: { linkedIssueId, linkType } };
      (issueService.linkIssue as vi.Mock).mockResolvedValue(undefined);

      await issueController.linkIssue(req as Request, res as Response);

      expect(issueService.linkIssue).toHaveBeenCalledWith(issueId, linkedIssueId, linkType);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Issue linked successfully' });
    });

    it('should return 500 if linking issue fails', async () => {
      const issueId = '1';
      const linkedIssueId = '2';
      const linkType = 'relates';
      const errorMessage = 'Failed to link issue';
      req = { params: { issueId }, body: { linkedIssueId, linkType } };
      (issueService.linkIssue as vi.Mock).mockRejectedValue(new Error(errorMessage));

      await issueController.linkIssue(req as Request, res as Response);

      expect(issueService.linkIssue).toHaveBeenCalledWith(issueId, linkedIssueId, linkType);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  // Test cases for addAttachment
  describe('addAttachment', () => {
    it('should return 400 if issueId is missing', async () => {
      req = { params: {}, files: {} };
      await issueController.addAttachment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing issueId' });
    });

    it('should return 400 if no files are uploaded', async () => {
      const issueId = '1';
      req = { params: { issueId }, files: {} };
      await issueController.addAttachment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No files were uploaded.' });
    });

    it('should return 201 if attachment is added successfully', async () => {
      const issueId = '1';
      const file = { data: Buffer.from('test'), name: 'test.txt', mimetype: 'text/plain', size: 10, encoding: 'utf8' };
      req = { params: { issueId }, files: { file: file } };
      (issueService.addAttachment as vi.Mock).mockResolvedValue(undefined);

      await issueController.addAttachment(req as Request, res as Response);

      expect(issueService.addAttachment).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Attachment added successfully' });
    });

    it('should return 500 if adding attachment fails', async () => {
      const issueId = '1';
      const file = { data: Buffer.from('test'), name: 'test.txt', mimetype: 'text/plain', size: 10, encoding: 'utf8' };
      const errorMessage = 'Failed to add attachment';
      req = { params: { issueId }, files: { file: file } };
      (issueService.addAttachment as vi.Mock).mockRejectedValue(new Error(errorMessage));

      await issueController.addAttachment(req as Request, res as Response);

      expect(issueService.addAttachment).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});