import { AppDataSource } from '../data-source';
import { Issue } from '../db/entities/issue.entity';

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
import { CreateIssueInput } from '../controllers/schemas/issue.schema';
import { User } from '../db/entities/user.entity';

export class IssueService {
  private issueRepository = AppDataSource.getRepository(Issue);

  constructor() {}

  async getIssue(id: number): Promise<any> {
    // TODO: Implement getIssue logic
    return { id, title: 'Test Issue', description: 'This is a test issue.' };
  }

  async create(data: CreateIssueInput): Promise<Issue> {
    try {
      // Fetch reporter and assignee
      const userRepository = AppDataSource.getRepository(User);
      const reporter = data.fields?.reporterKey ? await userRepository.findOne({ where: { userKey: data.fields.reporterKey } }) : null;
      const assignee = data.fields?.assigneeKey ? await userRepository.findOne({ where: { userKey: data.fields.assigneeKey } }) : null;

      // Validate reporter and assignee
      if (data.fields?.reporterKey && !reporter) {
        throw new Error('Reporter not found');
      }

      if (data.fields?.assigneeKey && !assignee) {
        throw new Error('Assignee not found');
      }

      const issue = this.issueRepository.create({
        title: data.fields?.summary,
        description: data.fields?.description,
        reporter: reporter,
        assignee: assignee,
        statusId: 11, // Default status
        priority: 'Medium', // Default priority
        issueTypeId: data.fields?.issuetype?.id ? parseInt(data.fields.issuetype.id) : 1
      });
      await this.issueRepository.save(issue);
      console.log("Issue after first save:", issue);
      issue.issueKey = this.generateIssueKey(issue.id);
      await this.issueRepository.save(issue);
      console.log("Issue after second save:", issue);
      return issue;
    } catch (error) {
      console.error('Error in IssueService.create:', error);
      // Ensure the specific error message is thrown for user not found
      if (error.message === 'Reporter not found' || error.message === 'Assignee not found') {
        throw error; // Re-throw the specific error
      }
      // Re-throw the error so the controller can handle it
      throw error;
    }
  }

  async findByKey(issueKey: string): Promise<Issue | null> {
    try {
      console.log(`Finding issue by key: ${issueKey}`);
      const issue = await this.issueRepository
        .createQueryBuilder('issue')
        .leftJoinAndSelect('issue.reporter', 'reporter')
        .leftJoinAndSelect('issue.assignee', 'assignee')
        .leftJoinAndSelect('issue.attachments', 'attachment')
        .leftJoinAndSelect('issue.inwardLinks', 'inwardIssueLink')
        .leftJoinAndSelect('inwardIssueLink.linkType', 'inwardLinkType')
        .leftJoinAndSelect('issue.outwardLinks', 'outwardIssueLink')
        .leftJoinAndSelect('outwardIssueLink.linkType', 'outwardLinkType')
        .where('issue.issueKey = :issueKey', { issueKey })
        .getOne();

      if (!issue) {
        console.log(`Issue with key ${issueKey} not found`);
        return null;
      }

      console.log(`Issue with key ${issueKey} found`);
      return issue;
    } catch (error) {
      console.error(`Error finding issue by key ${issueKey}:`, error);
      throw error;
    }
  }

  async deleteByKey(issueKey: string): Promise<boolean> {
    const result = await this.issueRepository.delete({ issueKey });
    return result.affected > 0;
  }

  private generateIssueKey(issueId: number): string {
    return `TASK-${issueId}`;
  }
}
