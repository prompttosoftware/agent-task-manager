import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Issue } from './issue.entity'; // Assuming you have an issue.entity.ts

@Entity()
export class IssueLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  linkTypeId: number;

  @ManyToOne(() => Issue, (issue) => issue.inwardLinks)
  @JoinColumn({ name: 'inwardIssueId' })
  inwardIssue: Issue;

  @ManyToOne(() => Issue, (issue) => issue.outwardLinks)
  @JoinColumn({ name: 'outwardIssueId' })
  outwardIssue: Issue;
}
