import { DataSource } from 'typeorm';
import * as path from 'path';
import { User } from './entities/user.entity';
import { Issue } from './entities/issue.entity';
import { IssueLink } from './entities/issue-link.entity';
import { Attachment } from './entities/attachment.entity';

const isProduction = process.env.NODE_ENV === 'production';

const dataSource = new DataSource({
  type: 'sqlite',
  database: isProduction ? 'agent-task-manager.sqlite' : process.env.NODE_ENV === 'test' ? 'test.sqlite' : 'agent-task-manager.sqlite',
  entities: [User, Issue, IssueLink, Attachment],
  migrations: [path.join(__dirname, './migrations/*.ts')],
  synchronize: !isProduction, // Disable auto-sync in production
  logging: !isProduction,
});

export default dataSource;
