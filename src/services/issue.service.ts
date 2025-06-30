import { BadRequestError, NotFoundError } from '../utils/http-errors';
export { NotFoundError };
import util from 'util';
import { AppDataSource } from '../data-source';
import { Issue } from '../db/entities/issue.entity';
import { IssueStatusCategoryMap, IssueStatusMap } from '../config/static-data';
import { GetIssuesForBoardParams, GetIssuesForBoardResponse, SearchParams } from '../controllers/issue.controller';

import { CreateIssueInput } from '../controllers/schemas/issue.schema';
import { User } from '../db/entities/user.entity';
import { AttachmentService, attachmentService } from "./attachment.service";
import { issueLinkService } from "./issueLink.service";
import { Repository } from 'typeorm';
import { getIssueTypeId } from '../config/issue-type-mapping';

export interface UpdateIssueFields {
  summary?: string;
  description?: string;
  reporterKey?: string;
  assigneeKey?: string;
  priority?: string;
  issuetype?: {
    id: string;
  };
}

export class IssueService {
  constructor(private issueRepository: Repository<Issue>, private attachmentService: AttachmentService) {}

  async create(data: CreateIssueInput): Promise<Issue> {
    try {
      // Fetch reporter and assignee
      const userRepository = AppDataSource.getRepository(User);
      let reporter: User | null = null;
      if (data.fields?.reporterKey) {
        reporter = await userRepository.findOne({ where: { userKey: data.fields.reporterKey } });
        if (!reporter) {
          throw new Error('Reporter not found');
        }
      }

      let assignee: User | null = null;
      if (data.fields?.assigneeKey) {
        assignee = await userRepository.findOne({ where: { userKey: data.fields.assigneeKey } });
        if (!assignee) {
          throw new Error('Assignee not found');
        }
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

  async update(issueKey: string, fields: UpdateIssueFields): Promise<Issue> {
    try {
      console.log(`Updating issue with key: ${issueKey}`, fields);

      // Find the existing issue
      const issue = await this.issueRepository.findOne({
        where: { issueKey },
        relations: ['reporter', 'assignee']
      });

      if (!issue) {
        throw new NotFoundError(`Issue with key ${issueKey} not found`);
      }

      const userRepository = AppDataSource.getRepository(User);

      // Update fields if provided
      if (fields.summary !== undefined) {
        issue.title = fields.summary;
      }

      if (fields.description !== undefined) {
        issue.description = fields.description;
      }

      if (fields.priority !== undefined) {
        issue.priority = fields.priority;
      }

      if (fields.issuetype?.id !== undefined) {
        issue.issueTypeId = parseInt(fields.issuetype.id);
      }

      // Handle reporter update
      if (fields.reporterKey !== undefined) {
        if (fields.reporterKey) {
          const reporter = await userRepository.findOne({ where: { userKey: fields.reporterKey } });
          if (!reporter) {
            throw new NotFoundError(`Reporter with key ${fields.reporterKey} not found`);
          }
          issue.reporter = reporter;
        } else {
          issue.reporter = null;
        }
      }

      // Handle assignee update
      if (fields.assigneeKey !== undefined) {
        if (fields.assigneeKey) {
          const assignee = await userRepository.findOne({ where: { userKey: fields.assigneeKey } });
          if (!assignee) {
            throw new NotFoundError(`Assignee with key ${fields.assigneeKey} not found`);
          }
          issue.assignee = assignee;
        } else {
          issue.assignee = null;
        }
      }

      // Save the updated issue
      await this.issueRepository.save(issue);
      console.log("Issue after update:", issue);

      // Return the updated issue with relations
      return await this.findByKey(issueKey);
    } catch (error) {
      console.error(`Error updating issue with key ${issueKey}:`, error);
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
        .leftJoinAndSelect('issue.attachments', 'attachments')
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
                id: link.outwardIssue.id,
                issueKey: link.outwardIssue.issueKey,
                title: link.outwardIssue.title,
                description: link.outwardIssue.description,
                statusId: link.outwardIssue.statusId,
                priority: link.outwardIssue.priority,
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
                id: link.inwardIssue.id,
                issueKey: link.inwardIssue.issueKey,
                title: link.inwardIssue.title,
                description: link.inwardIssue.description,
                statusId: link.inwardIssue.statusId,
                priority: link.inwardIssue.priority,
              },
            });
          }
        });
      }

      const issueWithLinks = {
        ...issue,
        links: links,
      };
      return JSON.parse(JSON.stringify(issueWithLinks));
    } catch (error) {
      console.error(`Error finding issue by key ${issueKey}:`, error);
      throw error;
    }
  }

  async deleteByKey(issueKey: string): Promise<boolean> {
    try {
      console.log(`Deleting issue with key: ${issueKey}`);

      const issue = await this.issueRepository.findOne({
        where: { issueKey },
        relations: ['attachments', 'inwardLinks', 'outwardLinks']
      });

      if (!issue) {
        throw new NotFoundError(`Issue with key ${issueKey} not found`);
      }

      // Delete attachments
      try {
        if (issue.attachments) {
          for (const attachment of issue.attachments) {
            await attachmentService.deleteAttachment(attachment.id);
          }
        }
      } catch (error) {
        console.error(`Error deleting attachments for issue ${issueKey}:`, error);
      }

      // Delete links
      try {
        if (issue.inwardLinks) {
          for (const link of issue.inwardLinks) {
            await issueLinkService.deleteIssueLink(link.id);
          }
        }

        if (issue.outwardLinks) {
          for (const link of issue.outwardLinks) {
            await issueLinkService.deleteIssueLink(link.id);
          }
        }
      } catch (error) {
        console.error(`Error deleting issue links for issue ${issueKey}:`, error);
      }

      const result = await this.issueRepository.delete({ issueKey });
      console.log(`Delete result: ${JSON.stringify(result)}`);
      return result.affected > 0;
    } catch (error) {
      console.error(`Error deleting issue with key ${issueKey}:`, error);
      throw error;
    }
  }

  private generateIssueKey(issueId: number): string {
    return `TASK-${issueId}`;
  }

  async search(searchParams: SearchParams): Promise<{ total: number; issues: Issue[] }> {
    const queryBuilder = this.issueRepository.createQueryBuilder('issue')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.assignee', 'assignee')
      .leftJoinAndSelect('issue.parent', 'parent');

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

    if (searchParams.parent !== undefined) {
      if (searchParams.parent === 'null' || searchParams.parent === '') {
        // Filter for issues with no parent (top-level issues)
        queryBuilder.andWhere('issue.parentId IS NULL');
      } else {
        // Filter for issues with specific parent key
        queryBuilder.leftJoin('issue.parent', 'parentIssue')
          .andWhere('parentIssue.issueKey = :parent', { parent: searchParams.parent });
      }
    }

    const [issues, total] = await queryBuilder.getManyAndCount();

    return { total, issues };
  }

  async getAvailableTransitions(issueKey: string): Promise<{ id: string; name: string }[]> {
    try {
      const issue = await this.findByKey(issueKey);

      if (!issue) {
        throw new NotFoundError(`Issue with key ${issueKey} not found`);
      }

      const currentStatusId = issue.statusId;
      const availableStatuses = IssueStatusMap;

      // In real workflow this would use a status-transition table
      // Instead we simply filter available statuses that is not current
      const transitions = Object.entries(availableStatuses)
        .filter(([statusId]) => parseInt(statusId) !== currentStatusId)
        .map(([statusId, statusName]: [string, string]) => ({
          id: statusId,
          name: statusName,
          category: IssueStatusCategoryMap[statusName]
        }));

      return transitions;
    } catch (error) {
      console.error(`Error getting available transitions for issue ${issueKey}:`, error);
      throw error;
    }
  }

  async updateAssignee(issueKey: string, userKey: string | null): Promise<void> {
    try {
      const issue = await this.findByKey(issueKey);

      if (!issue) {
        throw new NotFoundError(`Issue with key ${issueKey} not found`);
      }

      const userRepository = AppDataSource.getRepository(User);

      if (userKey) {
        const user = await userRepository.findOne({ where: { userKey } });
        if (!user) {
          throw new NotFoundError(`User with key ${userKey} not found`);
        }
        issue.assignee = user;
      } else {
        issue.assignee = null;
      }

      await this.issueRepository.save(issue);
    } catch (error) {
      throw error;
    }
  }


  async transition(issueKey: string, transition: { id: string }): Promise<void> {
    try {
      const issue = await this.findByKey(issueKey);

      if (!issue) {
        throw new NotFoundError(`Issue with key ${issueKey} not found`);
      }

      const availableTransitions = await this.getAvailableTransitions(issueKey);
      const isValidTransition = availableTransitions.some(t => t.id === transition.id);

      if (!isValidTransition) {
        throw new BadRequestError(`Invalid transition: ${transition.id} is not a valid transition from the current status`);
      }
      
      const statusId = transition.id;

      if (!IssueStatusMap[statusId]) {
        throw new BadRequestError(`Invalid status ID: ${statusId}`);
      }

      issue.statusId = parseInt(statusId);
      await this.issueRepository.save(issue);

    } catch (error) {
      console.error(`Error transitioning issue ${issueKey} to status ${transition.id}:`, error);
      throw error;
    }
  }

  async getIssuesForBoard(params: GetIssuesForBoardParams): Promise<GetIssuesForBoardResponse> {
    try {
      const {
        boardId,
        startAt = 0,
        maxResults = 50,
        fields = [],
        issueTypes = [],
        parentKey
      } = params;

      console.log(`Getting issues for board: ${boardId}, startAt: ${startAt}, maxResults: ${maxResults}`);

      // Since the project doesn't use boards, we'll get all issues with pagination
      const queryBuilder = this.issueRepository
        .createQueryBuilder('issue')
        .leftJoinAndSelect('issue.reporter', 'reporter')
        .leftJoinAndSelect('issue.assignee', 'assignee');

      // Add attachments if requested in fields
      if (fields.includes('attachment') || fields.length === 0) {
        queryBuilder.leftJoinAndSelect('issue.attachments', 'attachments');
      }

      // Add links if requested in fields
      if (fields.includes('issuelinks') || fields.length === 0) {
        queryBuilder
          .leftJoinAndSelect('issue.inwardLinks', 'inwardIssueLink')
          .leftJoinAndSelect('inwardIssueLink.linkType', 'inwardLinkType')
          .leftJoinAndSelect('issue.outwardLinks', 'outwardIssueLink')
          .leftJoinAndSelect('outwardIssueLink.linkType', 'outwardLinkType')
          .leftJoinAndSelect('inwardIssueLink.outwardIssue', 'inwardOutwardIssue')
          .leftJoinAndSelect('outwardIssueLink.inwardIssue', 'outwardInwardIssue')
          .addSelect(['inwardOutwardIssue.issueKey', 'outwardInwardIssue.issueKey', 'inwardOutwardIssue.id', 'outwardInwardIssue.id']);
      }

      // Filter by issue types if provided
      if (issueTypes.length > 0) {
        queryBuilder.andWhere('issue.issueTypeId IN (:...issueTypes)', { issueTypes });
      }

      // Filter by parent key if provided
      if (parentKey) {
        // Join with parent issue to filter by parent key
        queryBuilder
          .leftJoin('issue.parent', 'parentIssue')
          .andWhere('parentIssue.issueKey = :parentKey', { parentKey });
      }

      // Apply pagination
      queryBuilder
        .skip(startAt)
        .take(maxResults)
        .orderBy('issue.id', 'ASC');

      const [issues, total] = await queryBuilder.getManyAndCount();

      // Process issues to include links if needed
      const processedIssues = issues.map(issue => {
        if (fields.includes('issuelinks') || fields.length === 0) {
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
                    id: link.outwardIssue.id,
                    issueKey: link.outwardIssue.issueKey,
                    title: link.outwardIssue.title,
                    description: link.outwardIssue.description,
                    statusId: link.outwardIssue.statusId,
                    priority: link.outwardIssue.priority,
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
                    id: link.inwardIssue.id,
                    issueKey: link.inwardIssue.issueKey,
                    title: link.inwardIssue.title,
                    description: link.inwardIssue.description,
                    statusId: link.inwardIssue.statusId,
                    priority: link.inwardIssue.priority,
                  },
                });
              }
            });
          }

          return {
            ...issue,
            links: links,
          };
        }

        return issue;
      });

      return {
        startAt,
        maxResults,
        total,
        issues: JSON.parse(JSON.stringify(processedIssues))
      };
    } catch (error) {
      console.error(`Error getting issues for board ${params.boardId}:`, error);
      throw error;
    }
  }

  async getEpics(): Promise<Issue[]> {
    try {
      console.log('Getting epics');

      const epicTypeId = getIssueTypeId('Epic'); // Get the Epic type ID
      if (!epicTypeId) {
        throw new Error('Epic issue type not configured');
      }

      const queryBuilder = this.issueRepository
        .createQueryBuilder('issue')
        .leftJoinAndSelect('issue.reporter', 'reporter')
        .leftJoinAndSelect('issue.assignee', 'assignee')
        .leftJoinAndSelect('issue.attachments', 'attachments')
        .leftJoinAndSelect('issue.inwardLinks', 'inwardIssueLink')
        .leftJoinAndSelect('inwardIssueLink.linkType', 'inwardLinkType')
        .leftJoinAndSelect('issue.outwardLinks', 'outwardIssueLink')
        .leftJoinAndSelect('outwardIssueLink.linkType', 'outwardLinkType')
        .leftJoinAndSelect('inwardIssueLink.outwardIssue', 'inwardOutwardIssue')
        .leftJoinAndSelect('outwardIssueLink.inwardIssue', 'outwardInwardIssue')
        .addSelect(['inwardOutwardIssue.issueKey', 'outwardInwardIssue.issueKey', 'inwardOutwardIssue.id', 'outwardInwardIssue.id'])
        .where('issue.issueTypeId = :epicTypeId', { epicTypeId })
        .orderBy('issue.id', 'ASC');

      const epics = await queryBuilder.getMany();

      // Process epics to include links (same as before)
      const processedEpics = epics.map(epic => {
        const links = [];

        if (epic.inwardLinks) {
          epic.inwardLinks.forEach(link => {
            if (link.outwardIssue) {
              links.push({
                id: link.id,
                type: {
                  name: link.linkType.name,
                  inward: link.linkType.inward,
                  outward: link.linkType.outward,
                },
                outwardIssue: {
                  id: link.outwardIssue.id,
                  issueKey: link.outwardIssue.issueKey,
                  title: link.outwardIssue.title,
                  description: link.outwardIssue.description,
                  statusId: link.outwardIssue.statusId,
                  priority: link.outwardIssue.priority,
                },
              });
            }
          });
        }

        if (epic.outwardLinks) {
          epic.outwardLinks.forEach(link => {
            if (link.inwardIssue) {
              links.push({
                id: link.id,
                type: {
                  name: link.linkType.name,
                  inward: link.linkType.inward,
                  outward: link.linkType.outward,
                },
                inwardIssue: {
                  id: link.inwardIssue.id,
                  issueKey: link.inwardIssue.issueKey,
                  title: link.inwardIssue.title,
                  description: link.inwardIssue.description,
                  statusId: link.inwardIssue.statusId,
                  priority: link.inwardIssue.priority,
                },
              });
            }
          });
        }

        return {
          ...epic,
          links: links,
        };
      });

      return JSON.parse(JSON.stringify(processedEpics));
    } catch (error) {
      console.error('Error getting epics:', error);
      throw error;
    }
  }
}
