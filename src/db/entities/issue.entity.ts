import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Attachment } from './attachment.entity';
import { IssueLink } from './issue_link.entity';

@Entity()
export class Issue {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @Column({ unique: true })
  issueKey: string = '';

  @Column()
  summary: string = '';

  @Column({ type: 'text' })
  description: string = '';

  @Column()
  statusId: number = 0;

  @Column()
  issueTypeId: number = 0;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @ManyToOne(() => User)
  @JoinColumn()
  assignee: User | null = null;

  @ManyToOne(() => User)
  @JoinColumn()
  reporter: User | null = null;

  @ManyToOne(() => Issue, issue => issue.children, { nullable: true })
  @JoinColumn()
  parent: Issue | null = null;

  @ManyToOne(() => Issue, issue => issue.epic, { nullable: true })
  @JoinColumn()
  epic: Issue | null = null;

  @OneToMany(() => Issue, issue => issue.parent)
  children: Issue[] = [];

  @OneToMany(() => Attachment, attachment => attachment.issue)
  attachments: Attachment[] = [];

  @OneToMany(() => IssueLink, link => link.outwardIssue)
  issueLinks: IssueLink[] = [];
}
