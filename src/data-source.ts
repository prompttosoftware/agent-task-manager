import { DataSource } from "typeorm";
import config from './config';
import { Attachment } from "./db/entities/attachment.entity";
import { IssueLink } from "./db/entities/issue_link.entity";
import { Issue } from "./db/entities/issue.entity";
import { User } from "./db/entities/user.entity";

const AppDataSource = new DataSource({
    type: "postgres",
    host: config.DB_HOST || 'localhost',
    port: config.DB_PORT ? parseInt(config.DB_PORT, 10) : 5432,
    username: config.DB_USER || 'postgres',
    password: config.DB_PASS || 'password',
    database: config.DB_NAME || 'agent_task_db',
    synchronize: config.NODE_ENV === 'development',
    logging: config.NODE_ENV === 'development',
    entities: [Attachment, IssueLink, Issue, User],
    migrations: [],
    subscribers: [],
});

export default AppDataSource;
