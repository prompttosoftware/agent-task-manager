import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Issue } from './issue.entity';

@Entity({ name: 'issue_link' })
export class IssueLink {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @Column()
  linkTypeId: number = 0;

  @Column()
  inwardIssueId: number = 0;

  @ManyToOne(() => Issue, (issue) => issue.issueLinks)
  @JoinColumn({ name: 'inwardIssueId' })
  inwardIssue: Issue | null = null;

  @Column()
  outwardIssueId: number = 0;

  @ManyToOne(() => Issue, (issue) => issue.issueLinks)
  @JoinColumn({ name: 'outwardIssueId' })
  outwardIssue: Issue | null = null;
}
