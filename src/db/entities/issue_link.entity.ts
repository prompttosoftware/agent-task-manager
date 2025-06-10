import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Issue } from './issue.entity';

@Entity({ name: 'issue_link' })
export class IssueLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  linkTypeId: number;

  @Column()
  inwardIssueId: number;

  @ManyToOne(() => Issue, (issue) => issue.issueLinks)
  @JoinColumn({ name: 'inwardIssueId' })
  inwardIssue: Issue | null;

  @Column()
  outwardIssueId: number;

  @ManyToOne(() => Issue, (issue) => issue.issueLinks)
  @JoinColumn({ name: 'outwardIssueId' })
  outwardIssue: Issue | null;
}
