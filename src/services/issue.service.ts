import { BadRequestError, NotFoundError } from '../utils/http-errors';
export { NotFoundError };
import util from 'util';
import { AppDataSource } from '../data-source';
import { Issue } from '../db/entities/issue.entity';
import { SearchParams } from '../controllers/issue.controller';


import { CreateIssueInput } from '../controllers/schemas/issue.schema';
import { User } from '../db/entities/user.entity';

export class IssueService {
  private issueRepository = AppDataSource.getRepository(Issue);

  constructor(private transitionRepository: Repository<Transition>) {}

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
        .leftJoinAndSelect('issue.inwardLinks', 'inwardIssueLink')
        .leftJoinAndSelect('inwardIssueLink.linkType', 'inwardLinkType')
        .leftJoinAndSelect('issue.outwardLinks', 'outwardIssueLink')
        .leftJoinAndSelect('outwardIssueLink.linkType', 'outwardLinkType')
        .leftJoinAndSelect('inwardIssueLink.outwardIssue', 'inwardOutwardIssue')
        .leftJoinAndSelect('outwardIssueLink.inwardIssue', 'outwardInwardIssue')
        .addSelect(['inwardOutwardIssue.issueKey', 'outwardInwardIssue.issueKey', 'inwardOutwardIssue.id', 'outwardInwardIssue.id'])
        .where('issue.issueKey = :issueKey', { issueKey })
        .getOne();

      if (!issue) {
        console.log(`Issue with key ${issueKey} not found`);
        throw new NotFoundError('Issue not found');
      }

      console.log("Issue:", JSON.stringify(issue, null, 2));
      //console.error("Issue:", util.inspect(issue, { depth: null, colors: true })); // Removing this line

      const links = [];

      if (issue.inwardLinks) {
        issue.inwardLinks.forEach(link => {
          if (link.outwardIssue) {
            links.push({
              id: link.id,
              type: {
                name: link.linkType.name,
                inward: link.linkType.inward,
                outward: link.linkType.outward,
              },
              outwardIssue: {
                key: link.outwardIssue.issueKey,
              },
            });
          }
        });
      }

      if (issue.outwardLinks) {
        issue.outwardLinks.forEach(link => {
          if (link.inwardIssue) {
            links.push({
              id: link.id,
              type: {
                name: link.linkType.name,
                inward: link.linkType.inward,
                outward: link.linkType.outward,
              },
              inwardIssue: {
                key: link.inwardIssue.issueKey,
              },
            });
          }
        });
      }

      const issueWithLinks = {
        ...issue,
        links: links,
      };
      return issueWithLinks;
    } catch (error) {
      console.error(`Error finding issue by key ${issueKey}:`, error);
      throw error;
    }
  }

  async deleteByKey(issueKey: string): Promise<boolean> {
    try {
      console.log(`Deleting issue with key: ${issueKey}`);
      const result = await this.issueRepository.delete({ issueKey });
      console.log(`Delete result: ${JSON.stringify(result)}`);
      return result.affected > 0;
    } catch (error) {
      console.error(`Error deleting issue with key ${issueKey}:`, error);
      return false;
    }
  }

  private generateIssueKey(issueId: number): string {
    return `TASK-${issueId}`;
  }

  async search(searchParams: SearchParams): Promise<{ total: number; issues: Issue[] }> {
    const queryBuilder = this.issueRepository.createQueryBuilder('issue')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.assignee', 'assignee');

    if (searchParams.status !== undefined) {
      queryBuilder.andWhere('issue.statusId = :status', { status: searchParams.status });
    }

    if (searchParams.issuetype !== undefined) {
      queryBuilder.andWhere('issue.issueTypeId = :issuetype', { issuetype: searchParams.issuetype });
    }

    if (searchParams.assignee !== undefined) {
      queryBuilder.leftJoin('issue.assignee', 'user')
        .andWhere('user.userKey = :assignee', { assignee: searchParams.assignee });
    }

    const [issues, total] = await queryBuilder.getManyAndCount();

    return { total, issues };
  }

  async getAvailableTransitions(issueKey: string): Promise<{ id: string; name: string }[]> {
    try {
      const issue = await this.findByKey(issueKey);
      
      const currentStatusId = issue.statusId;
      const availableStatuses = IssueStatusMap;

      const transitions = Object.entries(availableStatuses)
        .filter(([statusId, statusName]) => parseInt(statusId) !== currentStatusId)
        .map(([statusId, statusName]) => ({
          id: statusId,
          name: statusName,
        }));

      return transitions;
    } catch (error) {
      console.error(`Error getting available transitions for issue ${issueKey}:`, error);
      throw error;
    }
  }
}
import { Repository } from 'typeorm';
import { Transition } from '../db/entities/transition.entity';
import { IssueStatusMap } from '../config/static-data';
