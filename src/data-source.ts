import { DataSource } from "typeorm";
import config from './config';
import { Transition } from "./db/entities/transition.entity";
import { Attachment } from "./db/entities/attachment.entity";
import { IssueLink } from "./db/entities/issue_link.entity";
import { Issue } from "./db/entities/issue.entity";
import { IssueType } from "./db/entities/issue_type.entity";
import { User } from "./db/entities/user.entity";
import { IssueLinkType } from "./db/entities/issue_link_type.entity";

const AppDataSource = new DataSource({
    type: "sqlite",
    database: "src/db/agent-task-manager.sqlite", // or wherever you want the file
    synchronize: true, // true only if you're okay with auto schema sync
    logging: config.NODE_ENV === 'development',
    migrationsRun: false,
    entities: [Attachment, IssueLink, Issue, User, IssueType, IssueLinkType, Transition],
    migrations: [],
    subscribers: [],
});

export { AppDataSource };
