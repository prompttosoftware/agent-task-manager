import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Issue } from "./issue.entity";

@Entity('issue_link')
export class IssueLink {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    linkTypeId: number;

    @ManyToOne(() => Issue, issue => issue.inwardLinks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inwardIssueId' })
    inwardIssue: Issue;

    @ManyToOne(() => Issue, issue => issue.outwardLinks)
    @JoinColumn({ name: 'outwardIssueId' })
    outwardIssue: Issue;
}
