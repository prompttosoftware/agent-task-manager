// test/services/issue.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueService } from '../../src/services/issue.service';
import { IssueRepository } from '../../src/repositories/issue.repository';
import { Issue } from '../../src/models/issue.model';

// Mock the IssueRepository
vi.mock('../../src/repositories/issue.repository');

describe('IssueService', () => {
  let issueService: IssueService;
  let issueRepository: IssueRepository;

  beforeEach(() => {
    // Reset mock before each test
    vi.clearAllMocks();
    issueRepository = new IssueRepository(); // Use the mock class
    issueService = new IssueService(issueRepository);
  });

  it('should create an issue', async () => {
    const mockIssueData: Partial<Issue> = { summary: 'Test Issue' };
    const mockCreatedIssue: Issue = { id: 1, ...mockIssueData } as Issue;
    vi.spyOn(issueRepository, 'create').mockResolvedValue(mockCreatedIssue);

    const createdIssue = await issueService.createIssue(mockIssueData);

    expect(createdIssue).toEqual(mockCreatedIssue);
    expect(issueRepository.create).toHaveBeenCalledWith(mockIssueData);
  });

  it('should get an issue by id', async () => {
    const mockIssueId = 1;
    const mockIssue: Issue = { id: mockIssueId, summary: 'Test Issue' } as Issue;
    vi.spyOn(issueRepository, 'findById').mockResolvedValue(mockIssue);

    const issue = await issueService.getIssueById(mockIssueId);

    expect(issue).toEqual(mockIssue);
    expect(issueRepository.findById).toHaveBeenCalledWith(mockIssueId);
  });

  it('should update an issue', async () => {
    const mockIssueId = 1;
    const mockIssueData: Partial<Issue> = { summary: 'Updated Issue' };
    const mockUpdatedIssue: Issue = { id: mockIssueId, ...mockIssueData } as Issue;
    vi.spyOn(issueRepository, 'update').mockResolvedValue(mockUpdatedIssue);

    const updatedIssue = await issueService.updateIssue(mockIssueId, mockIssueData);

    expect(updatedIssue).toEqual(mockUpdatedIssue);
    expect(issueRepository.update).toHaveBeenCalledWith(mockIssueId, mockIssueData);
  });

  it('should delete an issue', async () => {
    const mockIssueId = 1;
    vi.spyOn(issueRepository, 'delete').mockResolvedValue(undefined);

    await issueService.deleteIssue(mockIssueId);

    expect(issueRepository.delete).toHaveBeenCalledWith(mockIssueId);
  });
});
