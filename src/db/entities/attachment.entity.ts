import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Issue } from './issue.entity';
import { User } from './user.entity';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column()
  filename: string = '';

  @Column({ unique: true })
  storedFilename: string = '';

  @Column()
  mimetype: string = '';

  @Column({ type: 'integer' })
  size: number = 0;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @ManyToOne(() => Issue, (issue) => issue.attachments)
  @JoinColumn()
  issue: Issue = new Issue();

  @ManyToOne(() => User, (user) => user)
  @JoinColumn()
  author: User = new User();
}
