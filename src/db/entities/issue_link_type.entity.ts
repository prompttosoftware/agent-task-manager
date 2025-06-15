import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('issue_link_type')
export class IssueLinkType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  inward: string;

  @Column()
  outward: string;
}
