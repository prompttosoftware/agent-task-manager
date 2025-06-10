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

  @ManyToOne(() => User)
  @JoinColumn()
  assignee: User;

  @ManyToOne(() => User)
  @JoinColumn()
  reporter: User;

  @ManyToOne(() => Issue, issue => issue.children, { nullable: true })
  @JoinColumn()
  parent: Issue;

  @ManyToOne(() => Issue, issue => issue.epic, { nullable: true })
  @JoinColumn()
  epic: Issue;

  @OneToMany(() => Issue, issue => issue.parent)
  children: Issue[];

  @OneToMany(() => Attachment, attachment => attachment.issue)
  attachments: Attachment[];

  @OneToMany(() => IssueLink, link => link.outwardIssue)
  issueLinks: IssueLink[];
}
