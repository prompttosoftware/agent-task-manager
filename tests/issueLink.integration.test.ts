import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from "../src/data-source";
import { IssueLinkType } from "../src/db/entities/issue_link_type.entity";

describe('IssueLink Integration Tests', () => {
  let relatesLinkTypeId: number;
  let blocksLinkTypeId: number;

  beforeAll(async () => {
    const relatesLinkType = await AppDataSource.getRepository(IssueLinkType).findOneBy({ name: "Relates" });
    if (!relatesLinkType) {
      throw new Error("Relates link type not found. Ensure database is seeded correctly.");
    }
    relatesLinkTypeId = relatesLinkType.id;

    const blocksLinkType = await AppDataSource.getRepository(IssueLinkType).findOneBy({ name: "Blocks" });
    if (!blocksLinkType) {
      throw new Error("Blocks link type not found. Ensure database is seeded correctly.");
    }
    blocksLinkTypeId = blocksLinkType.id;
  });

  it('should successfully create an issue link with type Relates and return 201 Created', async () => {
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        "type": {
          "name": "Relates"
        },
        "inwardIssue": {
          "key": "SEED-1"
        },
        "outwardIssue": {
          "key": "SEED-2"
        }
      });
    expect(response.status).toBe(201);
  });

  it('should successfully create an issue link with type Blocks and return 201 Created', async () => {
    const payload = {
      "type": {
        "name": "Blocks"
      },
      "inwardIssue": {
        "key": "SEED-1"
      },
      "outwardIssue": {
        "key": "SEED-2"
      }
    };

    console.log("Sending payload:", payload);

    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send(payload);

    console.log("Received response:", response.status, response.body);

    expect(response.status).toBe(201);
  });


  it('should return 404 Not Found when inward issue does not exist', async () => {
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        "type": {
          "name": "Relates"
        },
        "inwardIssue": {
          "key": "NONEXISTENT-1"
        },
        "outwardIssue": {
          "key": "TASK-5"
        }
      });
    expect(response.status).toBe(404);
  });

  it('should return 400 Bad Request when link type is invalid', async () => {
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        "type": {
          "name": "InvalidLinkType"
        },
        "inwardIssue": {
          "key": "TASK-4"
        },
        "outwardIssue": {
          "key": "TASK-5"
        }
      });
    expect(response.status).toBe(400);
  });

  it('should return 400 Bad Request when payload is malformed', async () => {
    const response = await request(app)
      .post('/rest/api/2/issueLink')
      .send({
        "type": {
          "name": "Relates"
        },
        "inwardIssue": {
          "key": "TASK-4"
        },
        "outwardIssue": {} // Malformed: outwardIssue.key is missing
      });
    expect(response.status).toBe(400);
  });
});
