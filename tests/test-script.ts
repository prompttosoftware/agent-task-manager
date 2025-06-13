import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from "../src/data-source";
import { IssueLinkType } from "../src/db/entities/issue_link_type.entity";
import { Issue } from "../src/db/entities/issue.entity";
import { IssueType } from "../src/db/entities/issue_type.entity";

async function runTest() {
  try {
    // Ensure the database is connected
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Find or create an IssueType for testing
    let issueType = await AppDataSource.getRepository(IssueType).findOneBy({ name: "Task" });
    if (!issueType) {
      issueType = new IssueType();
      issueType.name = "Task";
      issueType = await AppDataSource.getRepository(IssueType).save(issueType);
    }

    const relatesLinkType = await AppDataSource.getRepository(IssueLinkType).findOneBy({ name: "Relates" });
    if (!relatesLinkType) {
      throw new Error("Relates link type not found. Ensure database is seeded correctly.");
    }
    const relatesLinkTypeId = relatesLinkType.id;

    // Create two issues for testing
    let issue1 = new Issue();
    issue1.key = "TASK-1";
    issue1.title = "First issue";
    issue1.type = issueType;
    issue1.description = "Description for first issue";
    issue1 = await AppDataSource.getRepository(Issue).save(issue1);

    let issue2 = new Issue();
    issue2.key = "TASK-2";
    issue2.title = "Second issue";
    issue2.type = issueType;
    issue2.description = "Description for second issue";
    issue2 = await AppDataSource.getRepository(Issue).save(issue2);


    // Call the POST /issueLink endpoint
    const response = await request(app)
      .post('/issueLink')
      .send({
        "type": {
          "name": "Relates"
        },
        "inwardIssue": {
          "key": "TASK-2"
        },
        "outwardIssue": {
          "key": "TASK-1"
        }
      });

    console.log(`Status code: ${response.status}`);
    console.log(`Response body: ${JSON.stringify(response.body)}`);

    if (response.status !== 201) {
      throw new Error(`Failed to create issue link: ${response.status}`);
    }
    // Verify a new record exists in the issue_link table
    const issueLinkRepository = AppDataSource.getRepository("issue_link");
    const newLink = await issueLinkRepository.findOne({
      where: {
        inwardIssueId: issue2.id,
        outwardIssueId: issue1.id,
        typeId: relatesLinkTypeId
      }
    });

    if (!newLink) {
      throw new Error("Issue link not found in the database");
    }

    console.log("Issue link created successfully");

    // Clean up
    await AppDataSource.getRepository(Issue).remove([issue1, issue2]);
    if (issueType && issueType.id) {
      await AppDataSource.getRepository(IssueType).remove([issueType]);
    }
    console.log("Clean up complete");

    process.exit(0);

  } catch (error: any) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

runTest();
