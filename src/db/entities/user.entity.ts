import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from 'typeorm';
import { Issue } from './issue.entity'; // Assuming issue.entity.ts is in the same directory

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  userKey: string;

  @Column()
  displayName: string;

  @Column()
  @Index({ unique: true })
  emailAddress: string;

  @OneToMany(() => Issue, issue => issue.assignee)
  assignedIssues: Issue[];

  @OneToMany(() => Issue, issue => issue.reporter)
  reportedIssues: Issue[];
}
