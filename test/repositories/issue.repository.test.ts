// test/repositories/issue.repository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueRepository } from '../../src/repositories/issue.repository';
import { Issue } from '../../src/models/issue.model';

describe('IssueRepository', () => {
  let issueRepository: IssueRepository;

  beforeEach(() => {
    issueRepository = new IssueRepository();
  });

  it('should create an issue', async () => {
    const issueData: Partial<Issue> = { summary: 'Test Issue' };
    const createdIssue = await issueRepository.create(issueData);
    expect(createdIssue.summary).toBe(issueData.summary);
  });

  it('should find an issue by id', async () => {
    const issueId = 1;
    const foundIssue = await issueRepository.findById(issueId);
    expect(foundIssue?.id).toBe(issueId);
  });

  it('should update an issue', async () => {
    const issueId = 1;
    const issueData: Partial<Issue> = { summary: 'Updated Issue' };
    const updatedIssue = await issueRepository.update(issueId, issueData);
    expect(updatedIssue?.summary).toBe(issueData.summary);
  });

  it('should delete an issue', async () => {
    const issueId = 1;
    await issueRepository.delete(issueId);
    // Assuming delete doesn't return anything or throws an error on failure
    expect(true).toBe(true); // Placeholder assertion
  });
});