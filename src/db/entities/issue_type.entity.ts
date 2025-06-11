import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class IssueType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
