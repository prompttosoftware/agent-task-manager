import { issueController } from './issueController';
import { issueService } from '../services/issueService';
import { Request, Response } from 'express';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../services/issueService');

describe('issueController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: { issueId: '123' },
      body: { linkedIssueId: '456', linkType: 'relates' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('linkIssue', () => {
    it('should return 400 if required parameters are missing', async () => {
      req.params = {};
      await issueController.linkIssue(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required parameters' });
    });

    it('should call issueService.linkIssue with correct parameters', async () => {
      const linkIssueMock = vi.spyOn(issueService, 'linkIssue');
      await issueController.linkIssue(req as Request, res as Response);
      expect(linkIssueMock).toHaveBeenCalledWith('123', '456', 'relates');
    });

    it('should return 200 and success message on successful link', async () => {
      vi.mocked(issueService.linkIssue).mockResolvedValueOnce(undefined);
      await issueController.linkIssue(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Issue linked successfully' });
    });

    it('should return 500 and error message on service error', async () => {
      const errorMessage = 'Failed to link issues';
      vi.mocked(issueService.linkIssue).mockRejectedValueOnce(new Error(errorMessage));
      await issueController.linkIssue(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
