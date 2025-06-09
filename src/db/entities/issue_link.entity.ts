import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Issue } from './issue.entity';

@Entity('issue_links')
export class IssueLink {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column({ default: 0 })
    linkTypeId: number = 0;

    @ManyToOne(() => Issue, issue => issue.inwardLinks, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inwardIssueId' })
    inwardIssue: Issue | null = null;

    @ManyToOne(() => Issue, issue => issue.outwardLinks, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'outwardIssueId' })
    outwardIssue: Issue | null = null;
}
