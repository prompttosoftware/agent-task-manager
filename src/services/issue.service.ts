// src/services/issue.service.ts
import { IssueRepository } from '../repositories/issue.repository';
import { Issue } from '../models/issue.model';

export class IssueService {
  private issueRepository: IssueRepository;

  constructor(issueRepository: IssueRepository) {
    this.issueRepository = issueRepository;
  }

  async createIssue(issueData: Partial<Issue>): Promise<Issue> {
    const issue = await this.issueRepository.create(issueData);
    return issue;
  }

  async getIssueById(id: number): Promise<Issue | null> {
    const issue = await this.issueRepository.findById(id);
    return issue;
  }

  async updateIssue(id: number, issueData: Partial<Issue>): Promise<Issue | null> {
    const issue = await this.issueRepository.update(id, issueData);
    return issue;
  }

  async deleteIssue(id: number): Promise<void> {
    await this.issueRepository.delete(id);
  }
}
