import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { Issue } from './issue.entity';
import { User } from './user.entity';

@Entity()
@Unique(['storedFilename'])
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  storedFilename: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Issue, (issue) => issue.attachments)
  @JoinColumn()
  issue: Issue;

  @ManyToOne(() => User)
  @JoinColumn()
  author: User;
}
