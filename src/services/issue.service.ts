import { AppDataSource } from '../db/data-source';
import { Issue } from '../db/entities/issue.entity';
import { CreateIssueInput } from '../controllers/schemas/issue.schema';

export class IssueService {
  private issueRepository = AppDataSource.getRepository(Issue);

  constructor() {}

  async getIssue(id: number): Promise<any> {
    // TODO: Implement getIssue logic
    return { id, title: 'Test Issue', description: 'This is a test issue.' };
  }

  async create(data: CreateIssueInput): Promise<Issue> {
    try {
      const issue = this.issueRepository.create({
        title: data.title,
        description: data.description,
        priority: data.priority,
        statusId: data.statusId,
      });
      issue.issueKey = this.generateIssueKey(); // Generate issue key before saving
      await this.issueRepository.save(issue);
      return issue;
    } catch (error) {
      console.error('Error in IssueService.create:', error);
      throw error; // Re-throw the error to be caught in the controller
    }
  }

  async findByKey(issueKey: string): Promise<Issue | null> {
    return this.issueRepository.findOneBy({ issueKey });
  }

  async deleteByKey(issueKey: string): Promise<boolean> {
    const result = await this.issueRepository.delete({ issueKey });
    return result.affected > 0;
  }

  private generateIssueKey(): string {
    const timestamp = Date.now().toString(36); // Use base36 for shorter keys
    const randomId = Math.random().toString(36).substring(2, 7); // Generate a random alphanumeric string
    return `ISSUE-${timestamp}-${randomId}`.toUpperCase();
  }
}
