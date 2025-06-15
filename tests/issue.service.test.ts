import { IssueService } from '../src/services/issue.service';
import { Issue } from '../src/db/entities/issue.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from '../src/utils/http-errors';

describe('IssueService', () => {
  let issueService: IssueService;
  let issueRepository: Repository<Issue>;

  const mockIssueRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      addSelect: jest.fn().mockReturnThis()
    })),
  });

  beforeEach(() => {
    issueRepository = mockIssueRepository() as any;
    const mockAttachmentService = {};
    issueService = new IssueService(issueRepository as any, mockAttachmentService as any);
  });

  describe('create', () => {
    it('should successfully create an issue', async () => {
      const issueData = {
        fields: {
          summary: 'Test Issue',
          description: 'Test Description',
          reporterKey: 'user-1',
          assigneeKey: 'user-1',
          issuetype: { id: '1' },
        },
      };

      const createdIssue: Issue = {
        id: 1,
        issueKey: 'TEST-1',
        title: issueData.fields.summary,
        description: issueData.fields.description,
        issueTypeId: parseInt(issueData.fields.issuetype.id),
        statusId: 1,
        priority: null,
        reporter: { userKey: issueData.fields.reporterKey } as any,
        assignee: { userKey: issueData.fields.assigneeKey } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
        links: [],
        inwardLinks: [],
        outwardLinks: [],
        children: [],
        self: `/rest/api/2/issue/TEST-1`,
      } as Issue;

      (issueRepository.create as jest.Mock).mockReturnValue(createdIssue);
      (issueRepository.save as jest.Mock).mockResolvedValue(createdIssue);

      const result = await issueService.create(issueData);

      expect(issueRepository.create).toHaveBeenCalledWith({
        title: issueData.fields.summary,
        description: issueData.fields.description,
        reporter: { userKey: issueData.fields.reporterKey, displayName: 'John Doe', emailAddress: 'john.doe@example.com', id: 1 } as any,
        assignee: { userKey: issueData.fields.assigneeKey, displayName: 'John Doe', emailAddress: 'john.doe@example.com', id: 1 } as any,
        statusId: 11,
        priority: 'Medium',
        issueTypeId: parseInt(issueData.fields.issuetype.id)
      });
      expect(issueRepository.save).toHaveBeenCalledWith(createdIssue);
      expect(result).toEqual(createdIssue);
    });
  });

  describe('findByKey', () => {
    it('should return an issue when found', async () => {
      const issueKey = 'TEST-1';
      const expectedIssue: Issue = { id: 1, issueKey: issueKey, title: 'Test Issue', description: 'Test Description', statusId: 1, priority: null, issueTypeId: 1, createdAt: new Date(), updatedAt: new Date(), reporter: { userKey: 'user-1'} as any, assignee: { userKey: 'user-1'} as any, attachments: [], links: [], inwardLinks: [], outwardLinks: [], children: [], self: `/rest/api/2/issue/TEST-1` } as Issue;

      (issueRepository.createQueryBuilder as jest.Mock).mockImplementation(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(expectedIssue),
      }));

      const result = await issueService.findByKey(issueKey);

      expect(issueRepository.createQueryBuilder).toHaveBeenCalledWith('issue');
      expect(result).toEqual(expectedIssue);
    });

    it('should throw NotFoundError when issue is not found', async () => {
      const issueKey = 'NON-EXISTENT';

     (issueRepository.createQueryBuilder as jest.Mock).mockImplementation(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }));

      await expect(issueService.findByKey(issueKey)).rejects.toThrow(new NotFoundError(`Issue not found`));
    });
  });

  describe('deleteByKey', () => {
    it('should successfully delete an issue', async () => {
      const issueKey = 'TEST-1';
      const issueToDelete: Issue = { id: 1, issueKey: issueKey, title: 'Test Issue', description: 'Test Description', statusId: 1, priority: null, issueTypeId: 1, createdAt: new Date(), updatedAt: new Date(), reporter: { userKey: 'user-1'} as any, assignee: { userKey: 'user-1'} as any, attachments: [], links: [], inwardLinks: [], outwardLinks: [], children: [], self: `/rest/api/2/issue/TEST-1` } as Issue;

      (issueRepository.findOne as jest.Mock).mockResolvedValue(issueToDelete);
      (issueRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await issueService.deleteByKey(issueKey);

      expect(issueRepository.findOne).toHaveBeenCalledWith({ 
        where: { issueKey: issueKey },
        relations: ['attachments', 'inwardLinks', 'outwardLinks']
      });
      expect(issueRepository.delete).toHaveBeenCalledWith({ issueKey: issueKey });
    });

    it('should throw NotFoundException if issue to delete is not found', async () => {
      const issueKey = 'NON_EXISTENT';

      (issueRepository.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(issueService.deleteByKey(issueKey)).rejects.toThrow(new NotFoundError(`Issue with key ${issueKey} not found`));
      expect(issueRepository.findOne).toHaveBeenCalledWith({ 
        where: { issueKey: issueKey },
        relations: ['attachments', 'inwardLinks', 'outwardLinks']
      });
      expect(issueRepository.delete).not.toHaveBeenCalled();
    });
  });
});
