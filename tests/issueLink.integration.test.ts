import request from 'supertest';
import { DataSource } from 'typeorm';
import { app } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { Issue } from '../src/db/entities/issue.entity';
import { IssueLink } from '../src/db/entities/issue_link.entity';

describe('Issue Link Integration Tests', () => {
  let issueA: Issue;
  let issueB: Issue;



  beforeEach(async () => {
    // Clear the database before each test
    await AppDataSource.createQueryBuilder().delete().from(IssueLink).execute();
    await AppDataSource.createQueryBuilder().delete().from(Issue).execute();

    // Create two issues
    const issueRepository = AppDataSource.getRepository(Issue);
    issueA = await issueRepository.save({
      issueKey: 'TASK-A',
      title: 'Task A',
      description: 'Description A',
      status: 'Open',
      priority: 'Medium',
      issueTypeId: 1,
    });
    issueB = await issueRepository.save({
      issueKey: 'TASK-B',
      title: 'Task B',
      description: 'Description B',
      status: 'Open',
      priority: 'Medium',
      issueTypeId: 1,
    });
    console.log(`issueA.issueKey: ${issueA.issueKey}`);
    console.log(`issueB.issueKey: ${issueB.issueKey}`);
  });



  it('should successfully create an issue link', async () => {
    // Action: Send a POST request to /issueLink
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: {
          name: 'Blocks',
        },
        inwardIssue: {
          key: 'TASK-A',
        },
        outwardIssue: {
          key: 'TASK-B',
        },
      })
      .expect(201);

    // Verification: Check the database
    const issueLinkRepository = AppDataSource.getRepository(IssueLink);
    const issueLink = await issueLinkRepository.findOne({
      where: {
        inwardIssueId: issueA.id,
        outwardIssueId: issueB.id,
      },
      relations: ['linkType'],
    });
    console.log(`issueA.id: ${issueA.id}`);
    console.log(`issueB.id: ${issueB.id}`);
    expect(issueLink).toBeDefined();
    if (issueLink) {
      expect(issueLink.linkType.name).toBe('Blocks');
    }

    // Verification: Check the GET request to /issue/TASK-A
    const getIssueResponse = await request(app)
      .get(`/rest/api/2/issue/${issueA.issueKey}`)
      .expect(200);

    console.log(`getIssueResponse.body: ${JSON.stringify(getIssueResponse.body, null, 2)}`);
    expect(getIssueResponse.body.data.links).toBeDefined();
    expect(getIssueResponse.body.data.links.length).toBe(1);
    expect(getIssueResponse.body.data.links[0].outwardIssue.issueKey).toBe('TASK-B');
    expect(getIssueResponse.body.data.links[0].type.name).toBe('Blocks');
  }, 10000);

  it('should return 404 when inwardIssue key is invalid', async () => {
    // Action: Send a POST request to /issueLink with a non-existent inwardIssue.key
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: {
          name: 'Blocks',
        },
        inwardIssue: {
          key: 'NON-EXISTENT',
        },
        outwardIssue: {
          key: 'TASK-B',
        },
      })
      .expect(404);

    // Verification: Assert that the HTTP response is 404 Not Found
    expect(response.status).toBe(404);
  });

  it('should return 404 when outwardIssue key is invalid', async () => {
    // Action: Send a POST request to /issueLink with a non-existent outwardIssue.key
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: {
          name: 'Blocks',
        },
        inwardIssue: {
          key: 'TASK-A',
        },
        outwardIssue: {
          key: 'NON-EXISTENT',
        },
      })
      .expect(404);

    // Verification: Assert that the HTTP response is 404 Not Found
    expect(response.status).toBe(404);
  });

  it('should return 400 when link type is invalid', async () => {
    // Action: Send a POST request to /issueLink with an invalid link type
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: {
          name: 'Relates To Something Random',
        },
        inwardIssue: {
          key: 'TASK-A',
        },
        outwardIssue: {
          key: 'TASK-B',
        },
      })
      .expect(400);

    // Verification: Assert that the HTTP response is 400 Bad Request
    expect(response.status).toBe(400);
  });

  it('should return 400 when the payload is malformed (missing inwardIssue)', async () => {
    // Action: Send a POST request to /issueLink with a missing inwardIssue
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        type: {
          name: 'Blocks',
        },
        outwardIssue: {
          key: 'TASK-B',
        },
      })
      .expect(400);

    // Verification: Assert that the HTTP response is 400 Bad Request
    expect(response.status).toBe(400);
  });
});
