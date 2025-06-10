import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Issue } from './issue.entity';
import { User } from './user.entity';

@Entity('attachment')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  @Index({ unique: true })
  storedFilename: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Issue, (issue) => issue.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author: User;
}
