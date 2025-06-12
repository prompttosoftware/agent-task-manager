import { Issue } from '../db/entities/issue.entity';
import { IssueLinkType } from '../config/static-data';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from './issue.service';
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

    if (!(data.type.name in IssueLinkType)) {
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
    const issueLinkRepository = AppDataSource.getRepository('IssueLink'); // Assuming 'IssueLink' is the name used in AppDataSource
    const issueLink = issueLinkRepository.create({
      linkTypeId: IssueLinkType[data.type.name],
      inwardIssueId: inwardIssue.id,
      outwardIssueId: outwardIssue.id,
    });

    await issueLinkRepository.save(issueLink);

    return {
      type: { name: data.type.name },
      inwardIssue,
      outwardIssue,
    };
  }
}
