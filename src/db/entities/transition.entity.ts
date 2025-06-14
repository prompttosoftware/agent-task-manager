import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('transitions')
export class Transition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'from_status_id' })
  fromStatusId: number;

  @Column({ name: 'to_status_id' })
  toStatusId: number;
}
