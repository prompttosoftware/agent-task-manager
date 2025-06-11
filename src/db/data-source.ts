import { DataSource } from "typeorm";
import config from "../config";
import { Attachment } from "./entities/attachment.entity";
import { IssueLink } from "./entities/issue_link.entity";
import { Issue } from "./entities/issue.entity";
import { User } from "./entities/user.entity";
import path from "path";

const nodeEnv = process.env.NODE_ENV || "development";

const database =
  nodeEnv === "test" ? "test.sqlite" : "agent-task-manager.sqlite";


class CustomDataSource extends DataSource {
  async initializeAndQuery(query: string): Promise<any> {
    console.log("initializeAndQuery called!");
    const result = await this.query(query);
    return result;
  }
}


export const AppDataSource = new CustomDataSource({
  type: "sqlite",
  database: path.join(__dirname, database),
  entities: [Attachment, IssueLink, Issue, User],
  migrations: [path.join(__dirname, "migrations", "*.ts")],
  synchronize: false, // Enable synchronize in development!
  logging: config.db.logging,
});
