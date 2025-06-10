import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity()
@Unique(['userKey'])
@Unique(['emailAddress'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userKey: string;

  @Column()
  displayName: string;

  @Column()
  emailAddress: string;
}
