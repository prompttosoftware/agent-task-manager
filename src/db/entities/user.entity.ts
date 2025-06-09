import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    Unique,
} from 'typeorm';

@Entity('users')
@Unique(['emailAddress'])
export class User {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column({ unique: true })
    @Index()
    userKey: string = '';

    @Column()
    displayName: string = '';

    @Column({ unique: true })
    emailAddress: string = '';
}
