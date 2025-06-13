import { DataSource } from "typeorm";
import config from './config';
import { Attachment } from "./db/entities/attachment.entity";
import { IssueLink } from "./db/entities/issue_link.entity";
import { Issue } from "./db/entities/issue.entity";
import { IssueType } from "./db/entities/issue_type.entity";
import { User } from "./db/entities/user.entity";
import { IssueLinkType } from "./db/entities/issue_link_type.entity";

const AppDataSource = new DataSource({
    type: config.NODE_ENV === 'test' ? "sqlite" : "postgres",
    host: config.NODE_ENV === 'test' ? undefined : config.DB_HOST || 'localhost',
    port: config.NODE_ENV === 'test' ? undefined : process.env.DB_PORT ? parseInt(process.env.DB_PORT as string, 10) : 5432,
    username: config.NODE_ENV === 'test' ? undefined : config.DB_USER || 'postgres',
    password: config.NODE_ENV === 'test' ? undefined : config.DB_PASS || 'password',
    database: config.NODE_ENV === 'test' ? ":memory:" : config.DB_NAME || 'agent_task_db',
    synchronize: config.NODE_ENV === 'test', // Enable auto schema sync for tests
    logging: config.NODE_ENV === 'development',
    migrationsRun: config.NODE_ENV === 'test',
    entities: [Attachment, IssueLink, Issue, User, IssueType, IssueLinkType],
    migrations: [],
    subscribers: [],
});

export { AppDataSource };
