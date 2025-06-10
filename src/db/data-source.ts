import { DataSource } from 'typeorm';
import config from '../config';
import { Attachment } from './entities/attachment.entity';
import { Issue } from './entities/issue.entity';
import { IssueLink } from './entities/issue_link.entity';
import { User } from './entities/user.entity';

const dataSource = new DataSource({
  type: 'sqlite',
  database: config.NODE_ENV === 'test' ? 'test.sqlite' : 'agent-task-manager.sqlite',
  synchronize: false, // Use migrations for schema management in production
  logging: config.NODE_ENV !== 'production',
  entities: [Attachment, Issue, IssueLink, User],
  migrations: ['src/db/migrations/*.ts'],
});

export default dataSource;
