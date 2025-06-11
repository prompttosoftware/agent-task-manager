import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from 'typeorm';
import { Issue } from './issue.entity';
import { Attachment } from './attachment.entity';

@Entity()
@Unique(['userKey'])
@Unique(['emailAddress'])
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userKey: string;

    @Column()
    displayName: string;

    @Column()
    emailAddress: string;

    @OneToMany(() => Issue, (issue) => issue.assignee)
    assignedIssues: Issue[];

    @OneToMany(() => Issue, (issue) => issue.reporter)
    reportedIssues: Issue[];

    @OneToMany(() => Attachment, (attachment) => attachment.author)
    attachments: Attachment[];
}
