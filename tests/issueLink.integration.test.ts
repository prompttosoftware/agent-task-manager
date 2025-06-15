import request from 'supertest';
import { app } from '../src/app';
import { IssueLink } from '../src/db/entities/issue_link.entity'; // Import the IssueLink entity
import { AppDataSource } from '../src/db/data-source';
import { Issue } from '../src/db/entities/issue.entity';
import { IssueLinkType } from '../src/db/entities/issue_link_type.entity'; // Import IssueLinkType

async function findIssueByKeyWithRetry(issueKey: string, maxRetries: number = 10, delay: number = 1000): Promise<Issue | null> {
  const issueRepository = AppDataSource.getRepository(Issue);
  let retries = 0;

  while (retries < maxRetries) {
    const issue = await issueRepository.findOneBy({ issueKey });
    if (issue) {
      return issue;
    }

    retries++;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return null;
}



describe('Issue Link API Integration Tests', () => {
  let linkTypeId: number;
  let issueKey1: string;
  let issueKey2: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    linkTypeId = 1000;

    // Create an IssueLinkType
    const issueLinkTypeRepository = AppDataSource.getRepository(IssueLinkType);
    const issueLinkType = issueLinkTypeRepository.create({
      id: linkTypeId,
      name: 'Blocks',
      inward: 'is blocked by',
      outward: 'blocks',
    });
    await issueLinkTypeRepository.save(issueLinkType);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('should create a link between two issues', async () => {

    // Create two issues
    const createResponse1 = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Issue 1 for Linking',
          description: 'Issue to link from',
          reporterKey: 'user-1',
          assigneeKey: 'user-1',
          issuetype: { id: '1' }
        }
      });
    expect(createResponse1.status).toBe(201);
    issueKey1 = createResponse1.body.key;

    const createResponse2 = await request(app)
      .post('/rest/api/2/issue')
      .send({
        fields: {
          summary: 'Issue 2 for Linking',
          description: 'Issue to link to',
          reporterKey: 'user-1',
          assigneeKey: 'user-1',
          issuetype: { id: '1' }
        }
      });

    expect(createResponse2.status).toBe(201);
    issueKey2 = createResponse2.body.key;

    console.log(`issueKey1 before findOneBy: ${issueKey1}`);
    console.log(`issueKey2 before findOneBy: ${issueKey2}`);

    // Verify that issues exist before creating the link
    const inwardIssue = await findIssueByKeyWithRetry(issueKey1);
    const outwardIssue = await findIssueByKeyWithRetry(issueKey2);

    console.log(`inwardIssue: ${JSON.stringify(inwardIssue)}`);
    console.log(`outwardIssue: ${JSON.stringify(outwardIssue)}`);

    expect(inwardIssue).toBeDefined();
    expect(outwardIssue).toBeDefined();

    if (!inwardIssue || !outwardIssue) {
      throw new Error('Could not find issues after multiple retries.');
    }

    const linkResponse = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: { name: 'Blocks' },
        inwardIssue: { key: issueKey1 },
        outwardIssue: { key: issueKey2 }
      });

    expect(linkResponse.status).toBe(201);

    // Assert that the link was created in the database
    const issueLinkRepository = AppDataSource.getRepository(IssueLink);

    const refreshedInwardIssue = await findIssueByKeyWithRetry(issueKey1);

    const refreshedOutwardIssue = await findIssueByKeyWithRetry(issueKey2);

    expect(refreshedInwardIssue).toBeDefined();
    expect(refreshedOutwardIssue).toBeDefined();

    const newIssueLinkRepository = AppDataSource.getRepository(IssueLink);
    const issueLink = await newIssueLinkRepository.findOne({
        where: {
            inwardIssueId: refreshedInwardIssue.id,
            outwardIssueId: refreshedOutwardIssue.id,
          },
    });

    expect(issueLink).toBeDefined();
    expect(issueLink).not.toBeNull();


// Assert that the link is present in the GET /issue response
const getIssueResponse = await request(app).get(`/rest/api/2/issue/${issueKey1}`);
expect(getIssueResponse.status).toBe(200);
expect(getIssueResponse.body.fields.issuelinks).toBeDefined();

const issueLinks = getIssueResponse.body.fields.issuelinks;
expect(Array.isArray(issueLinks)).toBe(true);

const expectedLink = issueLinks.find((link: any) => {
  return (
    (link.inwardIssue && link.inwardIssue.key === issueKey1 && link.outwardIssue && link.outwardIssue.key === issueKey2) ||
    (link.outwardIssue && link.outwardIssue.key === issueKey1 && link.inwardIssue && link.inwardIssue.key === issueKey2)
  );
});

expect(expectedLink).toBeDefined();
expect(expectedLink).not.toBeNull();
  }, 10000);

  it('Error Case: Invalid `inwardIssue` Key', async () => {
    const linkResponse = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: { name: 'Blocks' },
        inwardIssue: { key: 'NONEXISTENT-123' },
        outwardIssue: { key: issueKey2 }
      });

    expect(linkResponse.status).toBe(404);
  });

  it('Error Case: Invalid `outwardIssue` Key', async () => {
    const linkResponse = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: { name: 'Blocks' },
        inwardIssue: { key: issueKey1 },
        outwardIssue: { key: 'NONEXISTENT-123' }
      });

    expect(linkResponse.status).toBe(404);
  });

  it('Error Case: Invalid Link Type', async () => {
    const linkResponse = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: { name: 'Relates To Something Random' },
        inwardIssue: { key: issueKey1 },
        outwardIssue: { key: issueKey2 }
      });

    expect(linkResponse.status).toBe(400);
  });

  it('should return 400 for malformed payload (missing inwardIssue)', async () => {
    const linkResponse = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: { name: 'Blocks' },
        outwardIssue: { key: issueKey2 }
      });

    expect(linkResponse.status).toBe(400);
  });
});