import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from "../src/data-source";
import { IssueLinkType } from "../src/db/entities/issue_link_type.entity";

describe('IssueLink Integration Tests', () => {
  let relatesLinkTypeId: number;

  beforeAll(async () => {
    const relatesLinkType = await AppDataSource.getRepository(IssueLinkType).findOneBy({ name: "Relates" });
    if (!relatesLinkType) {
      throw new Error("Relates link type not found. Ensure database is seeded correctly.");
    }
    relatesLinkTypeId = relatesLinkType.id;
  });

  it('should successfully create an issue link and return 201 Created', async () => {
    const response = await request(app)
      .post('/issueLink')
      .send({
        "type": {
          "name": "Relates"
        },
        "inwardIssue": {
          "key": "ISSUE-1"
        },
        "outwardIssue": {
          "key": "ISSUE-2"
        }
      });
    expect(response.status).toBe(201);
  });

  it('should return 404 Not Found when inward issue does not exist', async () => {
    const response = await request(app)
      .post('/issueLink')
      .send({
        "type": {
          "name": "Relates"
        },
        "inwardIssue": {
          "key": "NONEXISTENT-1"
        },
        "outwardIssue": {
          "key": "ISSUE-2"
        }
      });
    expect(response.status).toBe(404);
  });

  it('should return 400 Bad Request when link type is invalid', async () => {
    const response = await request(app)
      .post('/issueLink')
      .send({
        "type": {
          "name": "InvalidLinkType"
        },
        "inwardIssue": {
          "key": "ISSUE-1"
        },
        "outwardIssue": {
          "key": "ISSUE-2"
        }
      });
    expect(response.status).toBe(400);
  });

  it('should return 400 Bad Request when payload is malformed', async () => {
    const response = await request(app)
      .post('/issueLink')
      .send({
        "type": {
          "name": "Relates"
        },
        "inwardIssue": {
          "key": "ISSUE-1"
        },
        "outwardIssue": {} // Malformed: outwardIssue.key is missing
      });
    expect(response.status).toBe(400);
  });
});
