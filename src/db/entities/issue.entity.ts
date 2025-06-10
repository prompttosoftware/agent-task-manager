import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Attachment } from './attachment.entity';
import { IssueLink } from './issue_link.entity';

@Entity()
@Unique(['issueKey'])
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
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

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  assignee: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  reporter: User;

  @ManyToOne(() => Issue, { nullable: true })
  @JoinColumn()
  parent: Issue;

  @ManyToOne(() => Issue, { nullable: true })
  @JoinColumn()
  epic: Issue;

  @OneToMany(() => Issue, (issue) => issue.parent)
  children: Issue[];

  @OneToMany(() => Attachment, (attachment) => attachment.issue)
  attachments: Attachment[];

  @OneToMany(() => IssueLink, (issueLink) => issueLink.inwardIssue)
  inwardLinks: IssueLink[];

  @OneToMany(() => IssueLink, (issueLink) => issueLink.outwardIssue)
  outwardLinks: IssueLink[];
}
