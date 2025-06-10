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
import { IssueLink } from './issue-link.entity';

@Entity('issue')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  issueKey: string;

  @Column()
  summary: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  statusId: number;

  @Column()
  issueTypeId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  assigneeId: number;

  @Column({ nullable: true })
  reporterId: number;

  @ManyToOne(() => User, (user) => user.assignedIssues, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ManyToOne(() => User, (user) => user.reportedIssues, { nullable: true })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @ManyToOne(() => Issue, (issue) => issue.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Issue;

  @ManyToOne(() => Issue, (issue) => issue.epics, { nullable: true })
  @JoinColumn({ name: 'epicId' })
  epic: Issue;

  @OneToMany(() => Issue, (issue) => issue.parent)
  children: Issue[];

  @OneToMany(() => Issue, (issue) => issue.epic)
  epics: Issue[]; // Added to enable reverse relation for epic

  @OneToMany(() => Attachment, (attachment) => attachment.issue)
  attachments: Attachment[];

  @OneToMany(() => IssueLink, (issueLink) => issueLink.inwardIssue)
  inwardLinks: IssueLink[];

  @OneToMany(() => IssueLink, (issueLink) => issueLink.outwardIssue)
  outwardLinks: IssueLink[];
}
