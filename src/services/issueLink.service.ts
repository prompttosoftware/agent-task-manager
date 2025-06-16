import { Issue } from '../db/entities/issue.entity';
import { IssueLinkType } from '../db/entities/issue_link_type.entity';
import { IssueLink } from '../db/entities/issue_link.entity';

import { z } from 'zod';
import { BadRequestError, NotFoundError } from '../utils/http-errors';
import { AppDataSource } from '../data-source';

const issueLinkCreateSchema = z.object({
  type: z.object({
    name: z.string(),
  }),
  inwardIssue: z.object({
    key: z.string(),
  }),
  outwardIssue: z.object({
    key: z.string(),
  }),
});

type IssueLinkCreateDTO = z.infer<typeof issueLinkCreateSchema>;

import { injectable, container } from 'tsyringe';
import { IssueLinkType as IssueLinkTypeEnum } from '../config/static-data';

@injectable()
export class IssueLinkService {
  async create(data: IssueLinkCreateDTO) {
    console.log('IssueLinkService.create called with data:', data);
    try {
      issueLinkCreateSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    const issueLinkTypeRepository = AppDataSource.getRepository(IssueLinkType);

    let issueLinkType = await issueLinkTypeRepository.findOneBy({ name: data.type.name });

    const isValidLinkType = Object.values(IssueLinkTypeEnum).some(
      (linkTypeName) => linkTypeName === data.type.name,
    );

    if (!isValidLinkType) {
      throw new BadRequestError(`Invalid link type: ${data.type.name}`);
    }

    const issueRepository = AppDataSource.getRepository(Issue);

    const inwardIssue = await issueRepository.findOneBy({ issueKey: data.inwardIssue.key });
    if (!inwardIssue) {
      throw new NotFoundError('Inward issue not found.');
    }

    const outwardIssue = await issueRepository.findOneBy({ issueKey: data.outwardIssue.key });
    if (!outwardIssue) {
      throw new NotFoundError('Outward issue not found.');
    }

    // Persist the IssueLink entity to the database.
    const issueLinkRepository = AppDataSource.getRepository(IssueLink);
    const issueLink = issueLinkRepository.create({
      linkTypeId: issueLinkType.id,
      inwardIssueId: inwardIssue.id,
      outwardIssueId: outwardIssue.id,
    });
    console.log(`issueLink before save: ${JSON.stringify(issueLink, null, 2)}`);

    await issueLinkRepository.save(issueLink);

    return {
      type: { name: data.type.name },
      inwardIssue,
      outwardIssue,
    };
  }

  async deleteIssueLink(linkId: number): Promise<void> {
    const issueLinkRepository = AppDataSource.getRepository(IssueLink);
    const issueLink = await issueLinkRepository.findOneBy({ id: linkId });

    if (!issueLink) {
      throw new NotFoundError(`IssueLink with id ${linkId} not found`);
    }

    await issueLinkRepository.remove(issueLink);
  }

  async findByKey(id: number): Promise<IssueLink | null> {
    const issueLinkRepository = AppDataSource.getRepository(IssueLink);
    const issueLink = await issueLinkRepository.findOneBy({ id: id });

    if (!issueLink) {
      return null;
    }

    return issueLink;
  }

  async getIssueLinkById(linkId: number): Promise<IssueLink | null> {
const issueLinkRepository = AppDataSource.getRepository(IssueLink);
const issueLink = await issueLinkRepository.findOneBy({ id: linkId });

if (!issueLink) {
  return null;
}

return issueLink;
  }
}

export const issueLinkService = container.resolve(IssueLinkService);
