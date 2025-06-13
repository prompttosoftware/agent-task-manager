import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Issue } from "./issue.entity";
import { IssueLinkType } from "./issue_link_type.entity";

@Entity('issue_link')
export class IssueLink {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => IssueLinkType)
    @JoinColumn({ name: 'linkTypeId' })
    linkType: IssueLinkType;

    @Column()
    linkTypeId: number;

    @ManyToOne(() => Issue, issue => issue.inwardLinks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inwardIssueId' })
    inwardIssue: Issue;

    @Column({ name: 'inwardIssueId' })
    inwardIssueId: number;

    @ManyToOne(() => Issue, issue => issue.outwardLinks)
    @JoinColumn({ name: 'outwardIssueId' })
    outwardIssue: Issue;

    @Column({ name: 'outwardIssueId' })
    outwardIssueId: number;
}
