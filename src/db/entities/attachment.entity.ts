import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { Issue } from './issue.entity';
import { User } from './user.entity';

@Entity('attachments')
export class Attachment {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column({default: ''})
    filename: string = '';

    @Column({ unique: true, default: '' })
    storedFilename: string = '';

    @Column({default: ''})
    mimetype: string = '';

    @Column({default: 0})
    size: number = 0;

    @CreateDateColumn()
    createdAt: Date = new Date();

    @ManyToOne(() => Issue, issue => issue.attachments, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'issueId' })
    issue: Issue | null = null;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'authorId' })
    author: User | null = null;
}
