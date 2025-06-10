import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Issue } from './issue.entity';

@Entity()
export class IssueLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  linkTypeId: number;

  @ManyToOne(() => Issue, (issue) => issue.inwardLinks)
  @JoinColumn()
  inwardIssue: Issue;

  @ManyToOne(() => Issue, (issue) => issue.outwardLinks)
  @JoinColumn()
  outwardIssue: Issue;
}
