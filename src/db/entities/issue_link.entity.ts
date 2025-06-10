import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Issue } from './issue.entity';

@Entity({ name: 'issue_link' })
export class IssueLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  linkTypeId: number;

  @Column()
  inwardIssueId: number = 0;

  @ManyToOne(() => Issue, (issue) => issue.inwardLinks)
  @JoinColumn({ name: 'inwardIssueId' })
  inwardIssue: Issue;

  @Column()
  outwardIssueId: number = 0;

  @ManyToOne(() => Issue, (issue) => issue.outwardLinks)
  @JoinColumn({ name: 'outwardIssueId' })
  outwardIssue: Issue;
}
