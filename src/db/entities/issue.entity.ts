import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Attachment } from './attachment.entity';
import { IssueLink } from './issue_link.entity';

@Entity('issue')
export class Issue {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    issueKey: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ default: 1 })
    statusId: number;

    @Column()
    priority: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.assignedIssues)
    @JoinColumn({ name: 'assigneeId' })
    assignee: User;

    @ManyToOne(() => User, (user) => user.reportedIssues)
    @JoinColumn({ name: 'reporterId' })
    reporter: User;

    @ManyToOne(() => Issue, (issue) => issue.children, {
        nullable: true,
    })
    @JoinColumn({ name: 'parentId' })
    parent?: Issue;

    @ManyToOne(() => Issue, {
        nullable: true,
    })
    @JoinColumn({ name: 'epicId' })
    epic?: Issue;

    @OneToMany(() => Issue, (issue) => issue.parent)
    children: Issue[];

    @OneToMany(() => Attachment, (attachment) => attachment.issue)
    attachments: Attachment[];

    @OneToMany(() => IssueLink, (issueLink) => issueLink.inwardIssue)
    inwardLinks: IssueLink[];

    @OneToMany(() => IssueLink, (issueLink) => issueLink.outwardIssue)
    outwardLinks: IssueLink[];
}
