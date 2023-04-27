import { Entity, PrimaryGeneratedColumn,  ManyToOne, Column } from 'typeorm';
import { UserEntity } from 'src/user/Entities/user.entity';
@Entity()
export class Game {
    @PrimaryGeneratedColumn()
    id : number;

    @Column()

    type: string;

    @Column()
    status : string;
    
    @ManyToOne(() => UserEntity, (user) => user.game1)
    player1 : UserEntity;

    @Column()
    player1_score : number;
    
    @ManyToOne(() => UserEntity, (user) => user.game2)
    player2 : UserEntity;

    @Column()
    player2_score : number;

}