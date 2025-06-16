import { IssueLinkService } from '../src/services/issueLink.service';
import { AppDataSource } from '../src/data-source';
import { Issue } from '../src/db/entities/issue.entity';
import { IssueLink } from '../src/db/entities/issue_link.entity';
import { IssueLinkType } from '../src/db/entities/issue_link_type.entity';
import { BadRequestError, NotFoundError } from '../src/utils/http-errors';

beforeAll(async () => {
  // await AppDataSource.initialize(); // Initialized in global setup
});

afterAll(async () => {
  // await AppDataSource.destroy(); // Moved to global teardown
});

describe('IssueLinkService', () => {
  let issueLinkService: IssueLinkService;

  beforeEach(() => {
    issueLinkService = new IssueLinkService();
  });

  afterEach(async () => {
    // Clean up the database after each test
    const issueLinkRepository = AppDataSource.getRepository(IssueLink);
    const issueRepository = AppDataSource.getRepository(Issue);
    const issueLinkTypeRepository = AppDataSource.getRepository(IssueLinkType);

    // Remove any existing issue links
    const inwardIssue = await issueRepository.findOne({ where: { issueKey: 'IN-123' } });
    const outwardIssue = await issueRepository.findOne({ where: { issueKey: 'OUT-456' } });
    const existingInwardIssue = await issueRepository.findOne({ where: { issueKey: 'EXISTING-IN' } });

    if (inwardIssue && outwardIssue) {
      const issueLinkType = await issueLinkTypeRepository.findOneBy({ name: 'Relates' });
      const issueLink = await issueLinkRepository.findOne({
        where: {
          inwardIssue: { id: inwardIssue.id },
          outwardIssue: { id: outwardIssue.id },
          linkType: { id: issueLinkType.id },
        },
      });

      if (issueLink) {
        await issueLinkRepository.remove(issueLink);
      }
    }

    // Remove any existing issues
    if (inwardIssue) {
      await issueRepository.remove(inwardIssue);
    }

    if (outwardIssue) {
      await issueRepository.remove(outwardIssue);
    }

    if (existingInwardIssue) {
      await issueRepository.remove(existingInwardIssue);
    }
  });

  describe('create', () => {
    it('should successfully create an issue link', async () => {
      // Mock data
      const linkTypeName = 'Relates';
      const inwardIssueKey = 'IN-123';
      const outwardIssueKey = 'OUT-456';

      // Create mock issues in the database
      const inwardIssue = new Issue();
      inwardIssue.issueKey = inwardIssueKey;
      inwardIssue.title = 'Inward Issue Summary';
      inwardIssue.description = 'Inward Issue Description'; // Add description
      inwardIssue.issueTypeId = 1; // Replace with a valid issue type ID
      inwardIssue.priority = 'Medium';
      await AppDataSource.getRepository(Issue).save(inwardIssue);

      const outwardIssue = new Issue();
      outwardIssue.issueKey = outwardIssueKey;
      outwardIssue.title = 'Outward Issue Summary';
      outwardIssue.description = 'Outward Issue Description'; // Add description
      outwardIssue.issueTypeId = 2; // Replace with a valid issue type ID
      outwardIssue.priority = 'High';
      await AppDataSource.getRepository(Issue).save(outwardIssue);

      const createData = {
        type: { name: linkTypeName },
        inwardIssue: { key: inwardIssueKey },
        outwardIssue: { key: outwardIssueKey },
      };

      // Call the create method
      const result = await issueLinkService.create(createData);

      // Assertions
      expect(result.type.name).toBe(linkTypeName);
      expect(result.inwardIssue.issueKey).toBe(inwardIssueKey);
      expect(result.outwardIssue.issueKey).toBe(outwardIssueKey);

      // Verify that a new record is created in the issue_link table
      const issueLinkRepository = AppDataSource.getRepository(IssueLink);
      const issueLinkTypeRepository = AppDataSource.getRepository(IssueLinkType);
      const issueLinkType = await issueLinkTypeRepository.findOneBy({ name: linkTypeName });
      const newIssueLink = await issueLinkRepository.findOne({
        where: {
          inwardIssue: { id: inwardIssue.id },
          outwardIssue: { id: outwardIssue.id },
          linkType: { id: issueLinkType.id },
        },
      });
      expect(newIssueLink).toBeDefined();
    });

    it('should throw an error if the link type name is not found in the static map', async () => {
      const createData = {
        type: { name: 'InvalidLinkType' },
        inwardIssue: { key: 'IN-123' },
        outwardIssue: { key: 'OUT-456' },
      };

      await expect(issueLinkService.create(createData)).rejects.toThrowError(BadRequestError);
      await expect(issueLinkService.create(createData)).rejects.toThrow('Invalid link type: InvalidLinkType');
    });

    it('should throw an error if either the inward or outward issue key does not correspond to an existing issue', async () => {
      const linkTypeName = 'Relates';
      const inwardIssueKey = 'NON-EXISTENT-IN';
      const outwardIssueKey = 'NON-EXISTENT-OUT';

      const createData = {
        type: { name: linkTypeName },
        inwardIssue: { key: inwardIssueKey },
        outwardIssue: { key: outwardIssueKey },
      };

      await expect(issueLinkService.create(createData)).rejects.toThrowError(NotFoundError);
      await expect(issueLinkService.create(createData)).rejects.toThrow('Inward issue not found.');

      const inwardIssue = new Issue();
      inwardIssue.issueKey = 'EXISTING-IN';
      inwardIssue.title = 'Inward Issue Summary';
      inwardIssue.description = 'Inward Issue Description';
      inwardIssue.issueTypeId = 1; // Replace with a valid issue type ID
      inwardIssue.priority = 'Medium';
      await AppDataSource.getRepository(Issue).save(inwardIssue);

      const createData2 = {
        type: { name: linkTypeName },
        inwardIssue: { key: 'EXISTING-IN' },
        outwardIssue: { key: outwardIssueKey },
      };

      await expect(issueLinkService.create(createData2)).rejects.toThrowError(NotFoundError);
      await expect(issueLinkService.create(createData2)).rejects.toThrow('Outward issue not found.');

      await AppDataSource.getRepository(Issue).remove(inwardIssue);

    });

    it('should throw an error if the input does not match the zod schema', async () => {
      const createData = {
        type: { name: 123 }, // Invalid type
        inwardIssue: { key: 'IN-123' },
        outwardIssue: { key: 'OUT-456' },
      };

      await expect(issueLinkService.create(createData as any)).rejects.toThrowError(BadRequestError);
    });
  });
});
