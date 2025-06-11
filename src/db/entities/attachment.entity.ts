import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Issue } from './issue.entity';
import { User } from './user.entity';

@Entity('attachment')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column({ unique: true })
  storedFilename: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Issue, (issue) => issue.attachments)
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @ManyToOne(() => User, (user) => user.attachments)
  @JoinColumn({ name: 'authorId' })
  author: User;
}
