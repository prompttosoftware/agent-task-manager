// test/repositories/issue.repository.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IssueRepository } from '../../src/repositories/issue.repository';
import sequelize from '../../src/config/database.config';
import { Issue } from '../../src/models/issue.model';

describe('IssueRepository Integration Tests', () => {
  let issueRepository: IssueRepository;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    issueRepository = new IssueRepository();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create an issue', async () => {
    const issueData = { summary: 'Test Issue' };
    const createdIssue = await issueRepository.create(issueData);
    expect(createdIssue.summary).toBe(issueData.summary);
    expect(createdIssue.id).toBeDefined();
  });

  it('should find an issue by id', async () => {
    const issueData = { summary: 'Find Issue' };
    const createdIssue = await issueRepository.create(issueData);
    const foundIssue = await issueRepository.findById(createdIssue.id);
    expect(foundIssue?.id).toBe(createdIssue.id);
    expect(foundIssue?.summary).toBe(issueData.summary);
  });

  it('should update an issue', async () => {
    const issueData = { summary: 'Update Issue' };
    const createdIssue = await issueRepository.create(issueData);
    const updateData = { summary: 'Updated Issue' };
    const updatedIssue = await issueRepository.update(createdIssue.id, updateData);
    expect(updatedIssue?.summary).toBe(updateData.summary);
  });

  it('should delete an issue', async () => {
    const issueData = { summary: 'Delete Issue' };
    const createdIssue = await issueRepository.create(issueData);
    await issueRepository.delete(createdIssue.id);
    const foundIssue = await issueRepository.findById(createdIssue.id);
    expect(foundIssue).toBeNull();
  });
});
