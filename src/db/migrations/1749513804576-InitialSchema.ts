import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1749513804576 implements MigrationInterface {
    name = 'InitialSchema1749513804576'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userKey" varchar NOT NULL, "displayName" varchar NOT NULL, "emailAddress" varchar NOT NULL, CONSTRAINT "UQ_eea9ba2f6e1bb8cb89c4e672f62" UNIQUE ("emailAddress"), CONSTRAINT "UQ_f895fe808c3662976bee0b530ec" UNIQUE ("userKey"))`);
        await queryRunner.query(`CREATE TABLE "issue_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "linkTypeId" integer NOT NULL, "inwardIssueId" integer, "outwardIssueId" integer)`);
        await queryRunner.query(`CREATE TABLE "issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueKey" varchar NOT NULL, "summary" varchar NOT NULL, "description" text NOT NULL, "statusId" integer NOT NULL, "issueTypeId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" integer, "reporterId" integer, "parentId" integer, "epicId" integer, CONSTRAINT "UQ_921c1decd44af970d44784d866e" UNIQUE ("issueKey"))`);
        await queryRunner.query(`CREATE TABLE "attachment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "filename" varchar NOT NULL, "storedFilename" varchar NOT NULL, "mimetype" varchar NOT NULL, "size" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "issueId" integer, "authorId" integer, CONSTRAINT "UQ_eb96784ad7f49730d6e908950c7" UNIQUE ("storedFilename"))`);
        await queryRunner.query(`CREATE TABLE "temporary_issue_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "linkTypeId" integer NOT NULL, "inwardIssueId" integer, "outwardIssueId" integer, CONSTRAINT "FK_fa367ca095dedd273592483e750" FOREIGN KEY ("inwardIssueId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_af760f319dc6b9299c37bff72bb" FOREIGN KEY ("outwardIssueId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_issue_link"("id", "linkTypeId", "inwardIssueId", "outwardIssueId") SELECT "id", "linkTypeId", "inwardIssueId", "outwardIssueId" FROM "issue_link"`);
        await queryRunner.query(`DROP TABLE "issue_link"`);
        await queryRunner.query(`ALTER TABLE "temporary_issue_link" RENAME TO "issue_link"`);
        await queryRunner.query(`CREATE TABLE "temporary_issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueKey" varchar NOT NULL, "summary" varchar NOT NULL, "description" text NOT NULL, "statusId" integer NOT NULL, "issueTypeId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" integer, "reporterId" integer, "parentId" integer, "epicId" integer, CONSTRAINT "UQ_921c1decd44af970d44784d866e" UNIQUE ("issueKey"), CONSTRAINT "FK_d92e4c455673ad050d998bb2c56" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_668ba5ace621b4afbb808f2af48" FOREIGN KEY ("reporterId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_5b80b4f6d142f063d4a948155b0" FOREIGN KEY ("parentId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_e7f512a846f5931ca88c5e04f56" FOREIGN KEY ("epicId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_issue"("id", "issueKey", "summary", "description", "statusId", "issueTypeId", "createdAt", "updatedAt", "assigneeId", "reporterId", "parentId", "epicId") SELECT "id", "issueKey", "summary", "description", "statusId", "issueTypeId", "createdAt", "updatedAt", "assigneeId", "reporterId", "parentId", "epicId" FROM "issue"`);
        await queryRunner.query(`DROP TABLE "issue"`);
        await queryRunner.query(`ALTER TABLE "temporary_issue" RENAME TO "issue"`);
        await queryRunner.query(`CREATE TABLE "temporary_attachment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "filename" varchar NOT NULL, "storedFilename" varchar NOT NULL, "mimetype" varchar NOT NULL, "size" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "issueId" integer, "authorId" integer, CONSTRAINT "UQ_eb96784ad7f49730d6e908950c7" UNIQUE ("storedFilename"), CONSTRAINT "FK_54f51431f696f4d3b8436475e88" FOREIGN KEY ("issueId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_c8cacbfb04fdb38644032d02aa5" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_attachment"("id", "filename", "storedFilename", "mimetype", "size", "createdAt", "issueId", "authorId") SELECT "id", "filename", "storedFilename", "mimetype", "size", "createdAt", "issueId", "authorId" FROM "attachment"`);
        await queryRunner.query(`DROP TABLE "attachment"`);
        await queryRunner.query(`ALTER TABLE "temporary_attachment" RENAME TO "attachment"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attachment" RENAME TO "temporary_attachment"`);
        await queryRunner.query(`CREATE TABLE "attachment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "filename" varchar NOT NULL, "storedFilename" varchar NOT NULL, "mimetype" varchar NOT NULL, "size" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "issueId" integer, "authorId" integer, CONSTRAINT "UQ_eb96784ad7f49730d6e908950c7" UNIQUE ("storedFilename"))`);
        await queryRunner.query(`INSERT INTO "attachment"("id", "filename", "storedFilename", "mimetype", "size", "createdAt", "issueId", "authorId") SELECT "id", "filename", "storedFilename", "mimetype", "size", "createdAt", "issueId", "authorId" FROM "temporary_attachment"`);
        await queryRunner.query(`DROP TABLE "temporary_attachment"`);
        await queryRunner.query(`ALTER TABLE "issue" RENAME TO "temporary_issue"`);
        await queryRunner.query(`CREATE TABLE "issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueKey" varchar NOT NULL, "summary" varchar NOT NULL, "description" text NOT NULL, "statusId" integer NOT NULL, "issueTypeId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" integer, "reporterId" integer, "parentId" integer, "epicId" integer, CONSTRAINT "UQ_921c1decd44af970d44784d866e" UNIQUE ("issueKey"))`);
        await queryRunner.query(`INSERT INTO "issue"("id", "issueKey", "summary", "description", "statusId", "issueTypeId", "createdAt", "updatedAt", "assigneeId", "reporterId", "parentId", "epicId") SELECT "id", "issueKey", "summary", "description", "statusId", "issueTypeId", "createdAt", "updatedAt", "assigneeId", "reporterId", "parentId", "epicId" FROM "temporary_issue"`);
        await queryRunner.query(`DROP TABLE "temporary_issue"`);
        await queryRunner.query(`ALTER TABLE "issue_link" RENAME TO "temporary_issue_link"`);
        await queryRunner.query(`CREATE TABLE "issue_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "linkTypeId" integer NOT NULL, "inwardIssueId" integer, "outwardIssueId" integer)`);
        await queryRunner.query(`INSERT INTO "issue_link"("id", "linkTypeId", "inwardIssueId", "outwardIssueId") SELECT "id", "linkTypeId", "inwardIssueId", "outwardIssueId" FROM "temporary_issue_link"`);
        await queryRunner.query(`DROP TABLE "temporary_issue_link"`);
        await queryRunner.query(`DROP TABLE "attachment"`);
        await queryRunner.query(`DROP TABLE "issue"`);
        await queryRunner.query(`DROP TABLE "issue_link"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
