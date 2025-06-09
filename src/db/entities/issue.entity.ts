import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
    Unique,
    OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Attachment } from './attachment.entity';
import { IssueLink } from './issue_link.entity';

@Entity('issues')
@Unique(['issueKey'])
export class Issue {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column()
    @Index()
    issueKey: string = '';

    @Column()
    summary: string = '';

    @Column({ type: 'text' })
    description: string = '';

    @Column()
    @Index()
    statusId: number = 0;

    @Column()
    @Index()
    issueTypeId: number = 0;

    @Column()
    @Index()
    priorityId: number = 0;

    @CreateDateColumn()
    createdAt: Date = new Date();

    @UpdateDateColumn()
    updatedAt: Date = new Date();

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigneeId' })
    assignee: User | null = null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reporterId' })
    reporter: User | null = null;

    @ManyToOne(() => Issue, issue => issue.children, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent: Issue | null = null;

    @ManyToOne(() => Issue, issue => issue.children, { nullable: true })
    @JoinColumn({ name: 'epicId' })
    epic: Issue | null = null;

    @OneToMany(() => Issue, issue => issue.parent)
    children: Issue[] = [];

    @OneToMany(() => Attachment, attachment => attachment.issue)
    attachments: Attachment[] = [];

    @OneToMany(() => IssueLink, issueLink => issueLink.inwardIssue)
    inwardLinks: IssueLink[] = [];

    @OneToMany(() => IssueLink, issueLink => issueLink.outwardIssue)
    outwardLinks: IssueLink[] = [];
}
