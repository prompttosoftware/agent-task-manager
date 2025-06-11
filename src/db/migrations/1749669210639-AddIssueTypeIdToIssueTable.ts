import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIssueTypeIdToIssueTable1749669210639 implements MigrationInterface {
    name = 'AddIssueTypeIdToIssueTable1749669210639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "new_issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueKey" varchar NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "statusId" integer NOT NULL, "priority" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" integer, "reporterId" integer, "parentId" integer, "epicId" integer, "issue_type_id" varchar NOT NULL DEFAULT 'DEFAULT_ISSUE_TYPE', CONSTRAINT "UQ_921c1decd44af970d44784d866e" UNIQUE ("issueKey"), CONSTRAINT "FK_e7f512a846f5931ca88c5e04f56" FOREIGN KEY ("epicId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_5b80b4f6d142f063d4a948155b0" FOREIGN KEY ("parentId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_668ba5ace621b4afbb808f2af48" FOREIGN KEY ("reporterId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_d92e4c455673ad050d998bb2c56" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "new_issue"("id", "issueKey", "title", "description", "statusId", "priority", "createdAt", "updatedAt", "assigneeId", "reporterId", "parentId", "epicId", "issue_type_id") SELECT "id", "issueKey", "title", "description", "statusId", "priority", "createdAt", "updatedAt", "assigneeId", "reporterId", "parentId", "epicId", COALESCE("issue_type_id", 'DEFAULT_ISSUE_TYPE') FROM "issue"`);
        await queryRunner.query(`DROP TABLE "issue"`);
        await queryRunner.query(`ALTER TABLE "new_issue" RENAME TO "issue"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "issue" RENAME TO "temporary_issue"`);
        await queryRunner.query(`CREATE TABLE "issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueKey" varchar NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "statusId" integer NOT NULL, "priority" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" integer, "reporterId" integer, "parentId" integer, "epicId" integer, "issue_type_id" varchar, CONSTRAINT "UQ_921c1decd44af970d44784d866e" UNIQUE ("issueKey"), CONSTRAINT "FK_e7f512a846f5931ca88c5e04f56" FOREIGN KEY ("epicId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_5b80b4f6d142f063d4a948155b0" FOREIGN KEY ("parentId") REFERENCES "issue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_668ba5ace621b4afbb808f2af48" FOREIGN KEY ("reporterId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_d92e4c455673ad050d998bb2c56" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "issue"("id", "issueKey", "title", "description", "statusId", "priority", "createdAt", "updatedAt", "assigneeId", "reporterId", "parentId", "epicId", "issue_type_id") SELECT "id", "issueKey", "title", "description", "statusId", "priority", "createdAt", "updatedAt", "assigneeId", "reporterId", "parentId", "epicId", "issue_type_id" FROM "temporary_issue"`);
        await queryRunner.query(`DROP TABLE "temporary_issue"`);
    }

}
