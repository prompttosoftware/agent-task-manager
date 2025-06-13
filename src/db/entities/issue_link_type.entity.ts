import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class IssueLinkType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}
