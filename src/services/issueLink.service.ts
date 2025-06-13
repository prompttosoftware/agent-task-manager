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

export class IssueLinkService {
  async create(data: IssueLinkCreateDTO) {
    try {
      issueLinkCreateSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    const issueLinkTypeRepository = AppDataSource.getRepository(IssueLinkType);
    const issueLinkType = await issueLinkTypeRepository.findOneBy({ name: data.type.name });

    if (!issueLinkType) {
      throw new BadRequestError('Invalid link type.');
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
      linkType: issueLinkType,
      inwardIssue: inwardIssue,
      outwardIssue: outwardIssue,
    });

    await issueLinkRepository.save(issueLink);

    return {
      type: { name: data.type.name },
      inwardIssue,
      outwardIssue,
    };
  }
}
